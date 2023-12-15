import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { OrderStream } from './order.stream';
import { CancelOrderCommand } from '../api/commands/cancel-order.command';
import { OrderCanceledEvent } from '../api/events/order-canceled.event';

@CommandHandler(CancelOrderCommand)
export class PlaceOrderHandler extends HandleCommand {
    async handle(command: CancelOrderCommand, session: DatabaseSession) {
        const cancelEvent = new OrderCanceledEvent(command.orderId);

        await session.eventStore.startStream(
            OrderStream,
            command.orderId,
            cancelEvent,
        );

        await session.outboxStore.publishEvent(cancelEvent);
    }
}
