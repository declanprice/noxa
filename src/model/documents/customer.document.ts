import {
    computedIndex,
    Document,
    DocumentField,
    DocumentId,
    fullTextSearchIndex,
    containsIndex,
} from '../../../lib';

@Document({
    optimistic: true,
    indexes: [
        computedIndex({
            fields: ['name'],
        }),
        computedIndex({
            fields: ['age'],
        }),
        computedIndex({
            fields: ['hobbies'],
        }),
        computedIndex({
            fields: ['address'],
        }),
        containsIndex({
            fields: ['name'],
        }),
        fullTextSearchIndex({
            fields: ['name'],
        }),
    ],
})
export class CustomerDocument {
    @DocumentId()
    customerId: string;

    @DocumentField()
    name: string;

    @DocumentField()
    age: number;

    @DocumentField()
    hobbies: string[];

    @DocumentField()
    address: {
        addressLine1: string;
        addressLine2: string;
        postcode: string;
        city: string;
    };

    constructor(data: {
        customerId: string;
        name: string;
        age: number;
        hobbies: string[];
        address: {
            addressLine1: string;
            addressLine2: string;
            postcode: string;
            city: string;
        };
    }) {
        this.customerId = data.customerId;
        this.name = data.name;
        this.age = data.age;
        this.hobbies = data.hobbies;
        this.address = data.address;
    }
}
