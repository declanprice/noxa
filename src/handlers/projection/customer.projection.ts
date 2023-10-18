import {
  ProjectionType,
  Projection,
  ProjectionEventHandler,
} from '../../../lib';

import {
  CustomerNameChanged,
  CustomerRegistered,
} from '../../model/streams/customer.stream';

import { ProjectionField } from '../../../lib/handlers/projection/projection.decorators';

@Projection({
  type: ProjectionType.Document,
})
export class CustomerProjection {
  @ProjectionField()
  customerId!: string;

  @ProjectionField()
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
