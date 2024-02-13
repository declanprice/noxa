import { Projection, ProjectionHandler } from '../../lib/handlers/projection';
import { OrderAcceptedEvent, OrderPlacedEvent } from '../command/order.stream';
import { ProjectionSession } from '../../lib/handlers/projection/projection-session.type';
import { DatabaseClient } from '../../lib/store/database-client.service';

@Projection({
    batchSize: 2500,
})
export class OrderProjection {
    constructor(private readonly db: DatabaseClient) {}

    @ProjectionHandler(OrderPlacedEvent)
    onCreated(session: ProjectionSession<OrderPlacedEvent>) {
        const { event, tx } = session;

        return tx.orders.create({
            data: {
                id: event.data.orderId,
                items: event.data.items,
                customerId: event.data.customerId,
                status: 'placed',
            },
        });
    }

    @ProjectionHandler(OrderAcceptedEvent)
    onAccepted(session: ProjectionSession<OrderAcceptedEvent>) {
        const { event, tx } = session;

        return tx.orders.update({
            where: {
                id: event.data.orderId,
            },
            data: {
                status: 'accepted',
            },
        });
    }
}
