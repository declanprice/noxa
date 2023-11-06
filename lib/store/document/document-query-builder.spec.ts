import {
    DocumentField,
    Document,
    asc,
    desc,
    DocumentQueryBuilder,
    eq,
    and,
    OR,
    AND,
    lt,
    between,
    gt,
} from '../../index';
import {
    arrayHas,
    contains,
    fieldToDataIndex,
    textSearch,
} from './document-query-builder';

@Document({
    optimistic: true,
    indexes: [],
})
class Customer {
    @DocumentField()
    name: string;

    @DocumentField()
    dateOfBirth: string;

    constructor(data: { name: string; dateOfBirth: string }) {
        this.name = data.name;
        this.dateOfBirth = data.dateOfBirth;
    }
}

describe('DocumentQueryBuilder', () => {
    it('should build query', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder
            .condition(eq('name', 'declan'))
            .or()
            .condition(eq('name', 'ryan'), and(), eq('age', 22))
            .and()
            .condition(lt('age', 33))
            .from(10)
            .size(15)
            .order(asc('name'), desc('age'));

        expect(builder.query).toEqual({
            conditions: [
                {
                    field: 'name',
                    multiValue: false,
                    operand: 'eq',
                    value: 'declan',
                },
                OR,
                [
                    {
                        field: 'name',
                        multiValue: false,
                        operand: 'eq',
                        value: 'ryan',
                    },
                    AND,
                    {
                        field: 'age',
                        multiValue: false,
                        operand: 'eq',
                        value: 22,
                    },
                ],
                AND,
                {
                    field: 'age',
                    multiValue: false,
                    operand: 'lt',
                    value: 33,
                },
            ],
            debug: false,
            from: 10,
            size: 15,
            order: [
                { field: 'name', order: 'asc' },
                { field: 'age', order: 'desc' },
            ],
        });
    });

    it('should build sql statement with eq condition', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder.condition(eq('name', 'declan'));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE (data ->> 'name')::text = $1`,
        );

        expect(values).toEqual(['declan']);
    });

    it('should build sql statement with lt condition', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder.condition(lt('age', 20));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE (data ->> 'age')::int < $1`,
        );

        expect(values).toEqual([20]);
    });

    it('should build sql statement with gt condition', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder.condition(gt('age', 20));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE (data ->> 'age')::int > $1`,
        );

        expect(values).toEqual([20]);
    });

    it('should build sql statement with between condition', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder.condition(between('age', 20, 30));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE (data ->> 'age')::int BETWEEN $1 AND $2`,
        );

        expect(values).toEqual([20, 30]);
    });

    it('should build sql statement with contains condition', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder.condition(contains('name', 'ecl'));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE (data ->> 'name')::text ilike $1`,
        );

        expect(values).toEqual(['%ecl%']);
    });

    it('should build sql statement with arrayHas condition', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder.condition(arrayHas('hobbies', ['snowboarding', 'climbing']));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE (data -> 'hobbies') @> $1`,
        );

        expect(values).toEqual(['["snowboarding","climbing"]']);
    });

    it('should build sql statement with fulltext-default condition', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder.condition(between('age', 20, 30));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE (data ->> 'age')::int BETWEEN $1 AND $2`,
        );

        expect(values).toEqual([20, 30]);
    });

    it('should build sql statement with full text search - default', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder.condition(textSearch('name', 'declan'));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE to_tsvector('english', (data ->> 'name')::text) @@ to_tsquery($1)`,
        );

        expect(values).toEqual(['declan']);
    });

    it('should build sql statement with full text search - plain', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder.condition(textSearch('name', 'declan', { type: 'plain' }));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE to_tsvector('english', (data ->> 'name')::text) @@ plainto_tsquery($1)`,
        );

        expect(values).toEqual(['declan']);
    });

    it('should build sql statement with full text search - phrase', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder.condition(textSearch('name', 'declan', { type: 'phrase' }));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE to_tsvector('english', (data ->> 'name')::text) @@ phraseto_tsquery($1)`,
        );

        expect(values).toEqual(['declan']);
    });

    it('should build sql statement with full text search - web', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder.condition(textSearch('name', 'declan', { type: 'web' }));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE to_tsvector('english', (data ->> 'name')::text) @@ websearch_to_tsquery($1)`,
        );

        expect(values).toEqual(['declan']);
    });

    it('should build sql statement with grouped conditions', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder
            .condition(eq('name', 'declan'), and(), lt('age', 30))
            .or()
            .condition(eq('name', 'bob'));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE ( (data ->> 'name')::text = $1 AND (data ->> 'age')::int < $2 ) OR (data ->> 'name')::text = $3`,
        );

        expect(values).toEqual(['declan', 30, 'bob']);
    });

    it('should build sql statement with limit/offset', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder.condition(eq('name', 'declan')).from(10).size(15);

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE (data ->> 'name')::text = $1 LIMIT 15 OFFSET 10`,
        );

        expect(values).toEqual(['declan']);
    });

    it('should build sql statement with one order condition', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder.condition(eq('name', 'declan')).order(asc('name'));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE (data ->> 'name')::text = $1 ORDER BY (data ->> 'name') ASC`,
        );

        expect(values).toEqual(['declan']);
    });

    it('should build sql statement with multiple order conditions', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder.condition(eq('name', 'declan')).order(asc('name'), desc('age'));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE (data ->> 'name')::text = $1 ORDER BY (data ->> 'name') ASC, (data ->> 'age') DESC`,
        );

        expect(values).toEqual(['declan']);
    });

    it('should build complex sql statement', () => {
        const builder = new DocumentQueryBuilder(Customer, {} as any);

        builder
            .condition(eq('name', 'declan'), and(), lt('age', 30))
            .or()
            .condition(eq('name', 'bob'))
            .or()
            .condition(arrayHas('hobbies', ['snowboarding']))
            .from(10)
            .size(10)
            .order(asc('name'), desc('age'));

        const { statement, values } = builder.createStatement();

        expect(statement).toEqual(
            `SELECT * FROM noxa_docs_customer WHERE ( (data ->> 'name')::text = $1 AND (data ->> 'age')::int < $2 ) OR (data ->> 'name')::text = $3 OR (data -> 'hobbies') @> $4 LIMIT 10 OFFSET 10 ORDER BY (data ->> 'name') ASC, (data ->> 'age') DESC`,
        );

        expect(values).toEqual(['declan', 30, 'bob', '["snowboarding"]']);
    });
});

describe('fieldToDataTarget', () => {
    it(`should convert field 'name' to (data ->> 'name')`, () => {
        expect(fieldToDataIndex('name')).toEqual(`(data ->> 'name')`);
    });

    it(`should convert nested object field 'address.postcode' to (data -> 'address' ->> 'postcode')`, () => {
        expect(fieldToDataIndex('address.postcode')).toEqual(
            `(data -> 'address' ->> 'postcode')`,
        );
    });

    it(`should convert deep nested object field 'address.deep.postcode' to (data -> 'address' -> 'deep' ->> 'postcode')`, () => {
        expect(fieldToDataIndex('address.deep.postcode')).toEqual(
            `(data -> 'address' -> 'deep' ->> 'postcode')`,
        );
    });

    it(`should convert root array field 'hobbies' to (data -> 'hobbies')`, () => {
        expect(fieldToDataIndex('hobbies', true)).toEqual(
            `(data -> 'hobbies')`,
        );
    });

    it(`should convert nested array field 'history.addresses' to (data -> 'history' -> 'addresses')`, () => {
        expect(fieldToDataIndex('history.addresses', true)).toEqual(
            `(data -> 'history' -> 'addresses')`,
        );
    });

    it(`should convert deep nested array field 'history.addresses' to (data -> 'history' -> 'deep' -> 'addresses')`, () => {
        expect(fieldToDataIndex('history.deep.addresses', true)).toEqual(
            `(data -> 'history' -> 'deep' -> 'addresses')`,
        );
    });
});
