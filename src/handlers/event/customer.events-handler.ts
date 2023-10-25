import {
  EventGroup,
  EventGroupHandler,
  HandleEventGroup,
  RabbitmqEventConsumerType,
} from '../../../lib';

import {
  CustomerNameChanged,
  CustomerRegistered,
} from '../../model/streams/customer.stream';

@EventGroup({
  consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
})
export class CustomerEventsHandler extends HandleEventGroup {
  @EventGroupHandler(CustomerRegistered)
  onRegistered(event: CustomerRegistered) {}

  @EventGroupHandler(CustomerNameChanged)
  onNameChanged(event: CustomerNameChanged) {}
}
