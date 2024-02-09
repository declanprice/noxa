import { EventHandler, EventMessage, HandleEvent } from '../../lib';
import { OrderPlacedEvent } from '../command/order.stream';

@EventHandler(OrderPlacedEvent)
export class OrderPlacedEventHandler implements HandleEvent {
    async handle(event: EventMessage<OrderPlacedEvent>) {
        console.log('[OrderPlacedEvent]', event);
    }
}
