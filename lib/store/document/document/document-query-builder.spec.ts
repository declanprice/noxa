import {
    DocumentField,
    DocumentFieldType,
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
} from '../../../../lib';
import { arrayHas } from './document-query-builder';

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
        const builder = new DocumentQueryBuilder(Customer);

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
            from: 10,
            size: 15,
            order: [
                { field: 'name', order: 'asc' },
                { field: 'age', order: 'desc' },
            ],
        });
    });

    it('should build sql statement', () => {
        const builder = new DocumentQueryBuilder(Customer);

        builder
            .condition(eq('name', 'declan'))
            .or()
            .condition(eq('name', 'ryan'), and(), eq('age', 22))
            .and()
            .condition(lt('age', 33))
            .and()
            .condition(between('age', 20, 30))
            .and()
            .condition(arrayHas('hobbies', ['hobbies']))
            .from(10)
            .size(15)
            .order(asc('name'), desc('age'));

        const statement = builder.createStatement();

        expect(statement).toEqual('SELECT * FROM noxa');
    });
});
