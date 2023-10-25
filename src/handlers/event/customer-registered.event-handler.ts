import {
  EventHandler,
  HandleEvent,
  RabbitmqEventConsumerType,
} from '../../../lib';

import { CustomerRegistered } from '../../model/streams/customer.stream';

@EventHandler(CustomerRegistered, {
  consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
})
export class CustomerRegisteredEventHandler extends HandleEvent {
  async handle(event: CustomerRegistered): Promise<void> {
    console.log('handling customer registered', event);
  }
}
