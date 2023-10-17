import {
  EventStreamProjectionType,
  EventStreamProjection,
  EventStreamProjectionHandler,
} from '../lib/event-stream-projection';

import { CustomerNameChanged, CustomerRegistered } from './customer.stream';
import { DocumentStore } from '../lib';
import { CustomerDocument } from './customer.document';
import { CustomerProjection } from './customer.projection';

@EventStreamProjection({
  type: EventStreamProjectionType.Generic,
})
export class CustomerGenericProjection {
  constructor(private documentStore: DocumentStore) {}

  @EventStreamProjectionHandler(CustomerRegistered, (e) => e.customerId)
  async onRegistered(event: CustomerRegistered) {
    await this.documentStore.store(
      new CustomerDocument(event.customerId, event.name),
    );
  }

  @EventStreamProjectionHandler(CustomerNameChanged, (e) => e.customerId)
  async onNameChanged(event: CustomerNameChanged) {
    const customer = await this.documentStore.get(
      CustomerDocument,
      event.customerId,
    );

    customer.name = event.name;

    await this.documentStore.store(customer);
  }
}
