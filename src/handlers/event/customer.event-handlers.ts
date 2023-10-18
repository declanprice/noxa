import {
  EventHandler,
  HandleEvent,
  RabbitmqEventConsumerType,
} from '../../../lib';

import {
  CustomerNameChanged,
  CustomerRegistered,
} from '../../model/streams/customer.stream';

@EventHandler(CustomerRegistered, {
  group: 'CustomerEvents',
  consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
})
export class CustomerRegisteredEventHandler
  implements HandleEvent<CustomerRegistered>
{
  async handle(event: CustomerRegistered): Promise<void> {
    console.log('handling customer registered', event);
  }
}

@EventHandler(CustomerNameChanged, {
  group: 'CustomerEvents',
})
export class CustomerNameChangedEventHandler
  implements HandleEvent<CustomerNameChanged>
{
  async handle(event: CustomerNameChanged): Promise<void> {
    console.log('handling customer name changed', event);
  }
}
