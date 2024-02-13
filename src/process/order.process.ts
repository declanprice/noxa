import { Process, ProcessHandler } from '../../lib/handlers/process';
import { RabbitmqEventConsumerType } from '../../lib';
import { OrderAcceptedEvent, OrderPlacedEvent } from '../command/order.stream';
import { ProcessSession } from '../../lib/handlers/process/process.session';

type OrderProcessState = {
    orderId: string;
    items: string[];
    status: string;
};

@Process({
    consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
    defaultAssociationKey: 'orderId',
})
export class OrderProcess {
    @ProcessHandler(OrderPlacedEvent, {
        start: true,
    })
    onPlaced(session: ProcessSession<OrderPlacedEvent, OrderProcessState>) {
        const { event, data, tx } = session;

        data.orderId = event.data.orderId;
        data.items = event.data.items;
        data.status = 'placed';
    }

    @ProcessHandler(OrderAcceptedEvent)
    onAccepted(session: ProcessSession<OrderAcceptedEvent, OrderProcessState>) {
        const { event, data, tx } = session;

        data.status = 'accepted';
    }
}
