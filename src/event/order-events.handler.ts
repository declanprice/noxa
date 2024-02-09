import {
    EventGroup,
    EventGroupHandler,
    EventMessage,
    HandleEvent,
    HandleEventGroup,
    RabbitmqEventConsumerType,
} from '../../lib';
import { OrderAcceptedEvent, OrderPlacedEvent } from '../command/order.stream';

@EventGroup({
    consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
})
export class OrderEventsHandler extends HandleEventGroup {
    @EventGroupHandler(OrderPlacedEvent)
    onPlaced(event: EventMessage<any>) {
        console.log('[OrderPlacedEvent]', event);
    }

    @EventGroupHandler(OrderAcceptedEvent)
    onAccepted(event: EventMessage<any>) {
        console.log('[OrderAcceptedEvent]', event);
    }
}
