import { Projection, ProjectionHandler } from '../../lib/handlers/projection';
import { EventMessage } from '../../lib';
import { DatabaseClient } from '../../lib/store/database-client.service';
import { OrderAcceptedEvent, OrderPlacedEvent } from '../command/order.stream';

@Projection({
    fetchEventsSize: 100,
    batchEventsSize: 100,
})
export class OrderProjection {
    constructor(private readonly db: DatabaseClient) {}

    @ProjectionHandler(OrderPlacedEvent)
    async onCreated(event: EventMessage<OrderPlacedEvent>) {
        return this.db.orders.create({
            data: {
                id: event.data.orderId,
                items: event.data.items,
                customerId: event.data.customerId,
                status: 'placed',
            },
        });
    }

    @ProjectionHandler(OrderAcceptedEvent)
    async onAccepted(event: EventMessage<OrderAcceptedEvent>) {
        return this.db.orders.update({
            where: {
                id: event.data.orderId,
            },
            data: {
                status: 'accepted',
            },
        });
    }
}
