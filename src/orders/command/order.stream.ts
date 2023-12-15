import { Stream, StreamEventHandler } from '../../../lib';

import { OrderRequestedEvent } from '../api/events/order-requested.event';
import { OrderLineItem } from '../api/commands/order-line-item.type';
import { OrderStatus } from '../api/commands/order-status.enum';

@Stream()
export class OrderStream {
    id: string;
    customerId: string;
    paymentId: string;
    status: OrderStatus;
    lineItems: OrderLineItem[];

    @StreamEventHandler(OrderRequestedEvent)
    onPlaced(event: OrderRequestedEvent) {
        this.id = event.orderId;
        this.lineItems = event.lineItems;
        this.customerId = event.customerId;
        this.status = OrderStatus.PLACED;
        this.paymentId = event.paymentId;
    }
}
