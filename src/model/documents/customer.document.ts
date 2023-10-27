import { Document, DocumentField, DocumentId } from '../../../lib';

@Document()
export class CustomerDocument {
    @DocumentId()
    customerId: string;

    @DocumentField()
    name: string;

    @DocumentField()
    age: number;

    constructor(data: { customerId: string; name: string; age: number }) {
        this.customerId = data.customerId;
        this.name = data.name;
        this.age = data.age;
    }
}
