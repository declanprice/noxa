import {
    Document,
    DocumentField,
    DocumentId,
    DocumentFieldType,
    uniqueIndex,
    computedIndex,
} from '../../../lib';

@Document({
    optimistic: true,
    indexes: [
        uniqueIndex({
            fields: ['customerId'],
        }),
        computedIndex({
            fields: ['name', 'age'],
        }),
    ],
})
export class CustomerDocument {
    @DocumentId({
        type: DocumentFieldType.String,
    })
    customerId: string;

    @DocumentField({
        type: DocumentFieldType.String,
    })
    name: string;

    @DocumentField({
        type: DocumentFieldType.Number,
    })
    age: number;

    constructor(data: { customerId: string; name: string; age: number }) {
        this.customerId = data.customerId;
        this.name = data.name;
        this.age = data.age;
    }
}
