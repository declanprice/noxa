import {
    EventGroup,
    EventGroupHandler,
    EventMessage,
    RabbitmqEventConsumerType,
} from '../../lib';

import { OrderAcceptedEvent, OrderPlacedEvent } from '../command/order.stream';

@EventGroup({
    consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
})
export class OrderEventsHandler {
    @EventGroupHandler(OrderPlacedEvent)
    onPlaced(event: EventMessage<any>) {
        console.log('[OrderPlacedEvent]', event);
    }

    @EventGroupHandler(OrderAcceptedEvent)
    onAccepted(event: EventMessage<any>) {
        console.log('[OrderAcceptedEvent]', event);
    }
}
