import {
  ProjectionType,
  Projection,
  ProjectionEventHandler,
} from '../../../lib';

import {
  CustomerNameChanged,
  CustomerRegistered,
} from '../../streams/customer.stream';

@Projection({
  type: ProjectionType.Document,
})
export class CustomerProjection {
  customerId!: string;
  name!: string;

  @ProjectionEventHandler(CustomerRegistered, (e) => e.customerId)
  onRegistered(event: CustomerRegistered) {
    this.customerId = event.customerId;
    this.name = event.name;
  }

  @ProjectionEventHandler(CustomerNameChanged, (e) => e.customerId)
  onNameChanged(event: CustomerNameChanged) {
    this.name = event.name;
  }
}
