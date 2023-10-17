import {
  EventStreamProjectionType,
  EventStreamProjection,
  EventStreamProjectionHandler,
} from '../lib/event-stream-projection';

import { CustomerNameChanged, CustomerRegistered } from './customer.stream';

@EventStreamProjection({
  type: EventStreamProjectionType.Document,
})
export class CustomerProjection {
  customerId!: string;
  name!: string;

  @EventStreamProjectionHandler(CustomerRegistered, (e) => e.customerId)
  onRegistered(event: CustomerRegistered) {
    this.customerId = event.customerId;
    this.name = event.name;
  }

  @EventStreamProjectionHandler(CustomerNameChanged, (e) => e.customerId)
  onNameChanged(event: CustomerNameChanged) {
    this.name = event.name;
  }
}
