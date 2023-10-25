import { DocumentProjection, ProjectionEventHandler } from '../../lib';

import {
  CustomerNameChanged,
  CustomerRegistered,
} from '../model/streams/customer.stream';

import { CustomerDocument } from '../model/documents/customer.document';

@DocumentProjection(CustomerDocument)
export class CustomerProjection {
  @ProjectionEventHandler(CustomerRegistered, (e) => e.customerId)
  onRegistered(event: CustomerRegistered) {
    return new CustomerDocument({
      customerId: event.customerId,
      name: event.name,
      age: event.age,
    });
  }

  @ProjectionEventHandler(CustomerNameChanged, (e) => e.customerId)
  onNameChanged(event: CustomerNameChanged, document: CustomerDocument) {
    return new CustomerDocument({
      customerId: document.customerId,
      name: event.name,
      age: document.age,
    });
  }
}
