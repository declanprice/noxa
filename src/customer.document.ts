import { Document, DocumentId } from '../lib';

@Document()
export class CustomerDocument {
  @DocumentId()
  customerId: string;

  name: string;

  constructor(customerId: string, name: string) {
    this.customerId = customerId;
    this.name = name;
  }
}
