import {
    EventHandler,
    HandleEvent,
    RabbitmqEventConsumerType,
} from '../../../lib';
import { CustomerRegistered } from '../../command/customer.stream';

@EventHandler(CustomerRegistered, {
    consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
})
export class CustomerRegisteredHandler extends HandleEvent {
    async handle(event: CustomerRegistered): Promise<void> {
        console.log('handling customer registered', event);
    }
}
