import { Document, DocumentField, DocumentId,ProcessDocument } from '../../../lib';

@Document()
export class CustomerProcessDocument extends ProcessDocument {
  @DocumentId()
  customerId: string;

  @DocumentField()
  name: string;

  @DocumentField()
  age: number;

  @DocumentField()
  deadlineId: string | null;

  constructor(data: {
    customerId: string;
    name: string;
    age: number;
    deadlineId: string | null;
  }) {
    super();

    this.customerId = data.customerId;
    this.name = data.name;
    this.age = data.age;
    this.deadlineId = data.deadlineId;
  }
}
