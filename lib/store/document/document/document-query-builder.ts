import { Type } from '@nestjs/common';
import { DocumentStore } from '../document-store.service';

export const OR = Symbol('OR');

export const AND = Symbol('AND');

export type QueryCondition = {
    field: string;
    value: any | any[];
    operand: 'eq' | 'lt' | 'gt' | 'between' | 'arrayHas';
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
};

export class DocumentQueryBuilder {
    private readonly _query: DocumentQuery = { conditions: [] };

    constructor(protected readonly documentType: Type) {}

    condition(...conditions: Conditions[]): DocumentQueryBuilder {
        if (conditions.length > 1) {
            this._query.conditions.push(conditions);
        } else {
            this._query.conditions.push(conditions[0]);
        }

        return this;
    }

    or(): DocumentQueryBuilder {
        this._query.conditions.push(OR);
        return this;
    }

    and(): DocumentQueryBuilder {
        this._query.conditions.push(AND);
        return this;
    }

    order(...conditions: OrderCondition[]): DocumentQueryBuilder {
        this._query.order = conditions;
        return this;
    }

    from(value: number): DocumentQueryBuilder {
        this._query.from = value;
        return this;
    }

    size(value: number): DocumentQueryBuilder {
        this._query.size = value;
        return this;
    }

    createStatement(): string {
        const values = [];

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
                        statement += ` $${values.length + 1} = $${
                            values.length + 2
                        }`;
                        values.push(condition.field);
                        values.push(condition.value);
                        break;
                    case 'lt':
                        statement += ` $${values.length + 1} < $${
                            values.length + 2
                        }`;
                        values.push(condition.field);
                        values.push(condition.value);
                        break;
                    case 'gt':
                        statement += ` $${values.length + 1} > $${
                            values.length + 2
                        }`;
                        values.push(condition.field);
                        values.push(condition.value);
                        break;
                    case 'between':
                        statement += ` $${values.length + 1} BETWEEN $${
                            values.length + 2
                        } AND $${values.length + 3}`;
                        values.push(condition.value[0]);
                        values.push(condition.value[1]);
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

        console.log(statement);

        return statement;
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

export const eq = (field: string, value: any): QueryCondition => {
    return {
        field,
        value,
        multiValue: false,
        operand: 'eq',
    };
};

export const lt = (field: string, value: any): QueryCondition => {
    return {
        field,
        value,
        multiValue: false,
        operand: 'lt',
    };
};

export const gt = (field: string, value: any): QueryCondition => {
    return {
        field,
        value,
        multiValue: false,
        operand: 'gt',
    };
};

export const between = (
    field: string,
    valueA: any,
    valueB: any,
): QueryCondition => {
    return {
        field,
        value: [valueA, valueB],
        multiValue: true,
        operand: 'between',
    };
};

export const arrayHas = (field: string, values: any[]): QueryCondition => {
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
