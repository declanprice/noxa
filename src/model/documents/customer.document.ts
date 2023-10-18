import { Document } from '../../../lib';

@Document()
export class CustomerDocument {
  customerId: string;

  name: string;

  constructor(customerId: string, name: string) {
    this.customerId = customerId;
    this.name = name;
  }
}
