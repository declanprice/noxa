import { Document, DocumentField } from '../../../lib';

@Document()
export class CustomerDocument {
  @DocumentField()
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
