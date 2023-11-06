import { Type } from '@nestjs/common';
import { DocumentStore } from './document-store.service';
import { Pool } from 'pg';
import { fi } from '@faker-js/faker';

export const OR = Symbol('OR');

export const AND = Symbol('AND');

export type QueryCondition = {
    field: string;
    value: any | any[];
    operand:
        | 'eq'
        | 'lt'
        | 'gt'
        | 'between'
        | 'arrayHas'
        | 'contains'
        | 'fulltext-default'
        | 'fulltext-plain'
        | 'fulltext-phrase'
        | 'fulltext-web';
    multiValue?: boolean;
    not?: boolean;
};

export type OrderCondition = {
    field: string;
    order: 'asc' | 'desc';
};

export type Conditions = QueryCondition | typeof OR | typeof AND;

export type DocumentQuery = {
    conditions: (Conditions | Conditions[])[];
    from?: number;
    size?: number;
    order?: OrderCondition[];
    debug: boolean;
};

export class DocumentQueryBuilder<DocumentType extends Type> {
    private readonly _query: DocumentQuery = { conditions: [], debug: false };

    constructor(
        protected readonly documentType: DocumentType,
        protected readonly connection: Pool,
    ) {}

    condition(...conditions: Conditions[]): DocumentQueryBuilder<DocumentType> {
        if (conditions.length > 1) {
            this._query.conditions.push(conditions);
        } else {
            this._query.conditions.push(conditions[0]);
        }

        return this;
    }

    or(): DocumentQueryBuilder<DocumentType> {
        this._query.conditions.push(OR);
        return this;
    }

    and(): DocumentQueryBuilder<DocumentType> {
        this._query.conditions.push(AND);
        return this;
    }

    order(...conditions: OrderCondition[]): DocumentQueryBuilder<DocumentType> {
        this._query.order = conditions;
        return this;
    }

    from(value: number): DocumentQueryBuilder<DocumentType> {
        this._query.from = value;
        return this;
    }

    size(value: number): DocumentQueryBuilder<DocumentType> {
        this._query.size = value;
        return this;
    }

    debug(): DocumentQueryBuilder<DocumentType> {
        this._query.debug = true;
        return this;
    }

    async execute(): Promise<DocumentType[]> {
        const { statement, values } = this.createStatement();

        if (this._query.debug) {
            console.log('STATEMENT', statement);
            console.log('VALUES', values);
        }

        const { rows } = await this.connection.query({
            text: statement,
            values,
        });

        return rows;
    }

    createStatement(): { statement: string; values: any[] } {
        const values: any[] = [];

        let statement = `SELECT * FROM ${DocumentStore.tableNameFromType(
            this.documentType,
        )} WHERE`;

        for (const condition of this.query.conditions) {
            const addCondition = (condition: Conditions) => {
                if (condition === OR) {
                    statement += ` OR`;
                    return;
                }

                if (condition === AND) {
                    statement += ` AND`;
                    return;
                }

                switch (condition.operand) {
                    case 'eq':
                        statement += ` ${fieldToDataIndex(
                            condition.field,
                        )}::${this.getCastType(condition.value)} = $${
                            values.length + 1
                        }`;
                        values.push(condition.value);
                        break;
                    case 'lt':
                        statement += ` ${fieldToDataIndex(
                            condition.field,
                        )}::int < $${values.length + 1}`;
                        values.push(condition.value);
                        break;
                    case 'gt':
                        statement += ` ${fieldToDataIndex(
                            condition.field,
                        )}::int > $${values.length + 1}`;
                        values.push(condition.value);
                        break;
                    case 'between':
                        statement += ` ${fieldToDataIndex(
                            condition.field,
                        )}::int BETWEEN $${values.length + 1} AND $${
                            values.length + 2
                        }`;
                        if (!Array.isArray(condition.value))
                            throw new Error(
                                'condition value must be an array for "between"',
                            );
                        values.push(condition.value[0]);
                        values.push(condition.value[1]);
                        break;
                    case 'contains':
                        statement += ` ${fieldToDataIndex(
                            condition.field,
                        )}::text ilike $${values.length + 1}`;
                        values.push(`%${condition.value}%`);
                        break;
                    case 'fulltext-default':
                        statement += ` to_tsvector('english', ${fieldToDataIndex(
                            condition.field,
                        )}::text) @@ to_tsquery($${values.length + 1})`;
                        values.push(condition.value);
                        break;
                    case 'fulltext-plain':
                        statement += ` to_tsvector('english', ${fieldToDataIndex(
                            condition.field,
                        )}::text) @@ plainto_tsquery($${values.length + 1})`;
                        values.push(condition.value);
                        break;
                    case 'fulltext-phrase':
                        statement += ` to_tsvector('english', ${fieldToDataIndex(
                            condition.field,
                        )}::text) @@ phraseto_tsquery($${values.length + 1})`;
                        values.push(condition.value);
                        break;
                    case 'fulltext-web':
                        statement += ` to_tsvector('english', ${fieldToDataIndex(
                            condition.field,
                        )}::text) @@ websearch_to_tsquery($${
                            values.length + 1
                        })`;
                        values.push(condition.value);
                        break;
                    case 'arrayHas':
                        statement += ` ${fieldToDataIndex(
                            condition.field,
                            true,
                        )} @> $${values.length + 1}`;
                        values.push(JSON.stringify(condition.value));
                        break;
                }
            };

            if (Array.isArray(condition)) {
                statement += ` (`;
                for (const groupedCondition of condition) {
                    addCondition(groupedCondition);
                }
                statement += ` )`;
            } else {
                addCondition(condition);
            }
        }

        if (this._query.size) {
            statement += ` LIMIT ${this._query.size}`;
        }

        if (this._query.from) {
            statement += ` OFFSET ${this._query.from}`;
        }

        if (this._query.order?.length) {
            statement += ` ORDER BY`;

            this._query.order.forEach((cond, index) => {
                statement += ` ${fieldToDataIndex(
                    cond.field,
                )} ${cond.order.toUpperCase()}`;

                if (index !== this._query.order?.length! - 1) {
                    statement += `,`;
                }
            });
        }

        return {
            statement,
            values,
        };
    }

    getCastType(value: string | number | boolean) {
        switch (typeof value) {
            case 'string':
                return 'text';
            case 'boolean':
                return 'bool';
            case 'number':
            case 'bigint':
                return 'int';
            default:
                throw new Error(`query cannot support type of ${typeof value}`);
        }
    }

    get query(): DocumentQuery {
        return this._query;
    }
}

export const or = (): typeof OR => {
    return OR;
};

export const and = (): typeof AND => {
    return AND;
};

export const not = (condition: QueryCondition): QueryCondition => {
    condition.not = true;
    return condition;
};

export const eq = (
    field: string,
    value: string | number | boolean,
): QueryCondition => {
    return {
        field,
        value,
        multiValue: false,
        operand: 'eq',
    };
};

export const lt = (field: string, value: number): QueryCondition => {
    return {
        field,
        value,
        multiValue: false,
        operand: 'lt',
    };
};

export const gt = (field: string, value: number): QueryCondition => {
    return {
        field,
        value,
        multiValue: false,
        operand: 'gt',
    };
};

export const between = (
    field: string,
    valueA: number,
    valueB: number,
): QueryCondition => {
    return {
        field,
        value: [valueA, valueB],
        multiValue: true,
        operand: 'between',
    };
};

export const contains = (field: string, value: string): QueryCondition => {
    return {
        field,
        value,
        multiValue: false,
        operand: 'contains',
    };
};

export const textSearch = (
    field: string,
    value: string,
    options?: { type: 'default' | 'plain' | 'phrase' | 'web' },
): QueryCondition => {
    return {
        field,
        value,
        multiValue: false,
        operand: `fulltext-${options?.type ?? 'default'}`,
    };
};

export const arrayHas = (
    field: string,
    values: (string | number | boolean)[],
): QueryCondition => {
    return {
        field,
        value: values,
        multiValue: true,
        operand: 'arrayHas',
    };
};

export const asc = (field: string): OrderCondition => {
    return {
        field,
        order: 'asc',
    };
};

export const desc = (field: string): OrderCondition => {
    return {
        field,
        order: 'desc',
    };
};

export const fieldToDataIndex = (
    field: string,
    isTargetFieldArray: boolean = false,
): string => {
    const fields = field.split('.');

    if (fields.length === 1) {
        if (isTargetFieldArray) {
            return `(data -> '${fields[0]}')`;
        }

        return `(data ->> '${fields[0]}')`;
    }

    let dataIndex: string = `(data`;

    fields.forEach((field, index) => {
        if (index === fields.length - 1) {
            if (isTargetFieldArray) {
                return (dataIndex += ` -> '${field}')`);
            }

            return (dataIndex += ` ->> '${field}')`);
        }

        return (dataIndex += ` -> '${field}'`);
    });

    return dataIndex;
};
