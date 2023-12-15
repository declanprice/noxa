import { DataProjection, ProjectionEventHandler } from '../../../lib';

import { Order, orders } from '../../schema';
import { OrderRequestedEvent } from '../api/events/order-requested.event';
import { OrderStatus } from '../api/commands/order-status.enum';
import { OrderPlacedEvent } from '../api/events/order-placed.event';
import { OrderCanceledEvent } from '../api/events/order-canceled.event';
import { OrderCompleteEvent } from '../api/events/order-complete.event';

@DataProjection(orders)
export class OrdersProjection {
    @ProjectionEventHandler(OrderRequestedEvent, (e) => e.orderId)
    onRequested(event: OrderRequestedEvent): Order {
        return {
            id: event.orderId,
            customerId: event.customerId,
            paymentId: event.paymentId,
            lineItems: event.lineItems,
            status: OrderStatus.REQUESTED,
        };
    }

    @ProjectionEventHandler(OrderPlacedEvent, (e) => e.orderId)
    onPlaced(event: OrderPlacedEvent, existing: Order): Order {
        return {
            ...existing,
            status: OrderStatus.PLACED,
        };
    }

    @ProjectionEventHandler(OrderCanceledEvent, (e) => e.orderId)
    onCanceled(event: OrderCanceledEvent, existing: Order): Order {
        return {
            ...existing,
            status: OrderStatus.CANCELLED,
        };
    }

    @ProjectionEventHandler(OrderCompleteEvent, (e) => e.orderId)
    onComplete(event: OrderCompleteEvent, existing: Order): Order {
        return {
            ...existing,
            status: OrderStatus.COMPLETE,
        };
    }
}
