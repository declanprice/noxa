import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { OrderStream } from './order.stream';
import { CompleteOrderCommand } from '../api/commands/complete-order.command';
import { OrderCompleteEvent } from '../api/events/order-complete.event';

@CommandHandler(CompleteOrderCommand)
export class PlaceOrderHandler extends HandleCommand {
    async handle(command: CompleteOrderCommand, session: DatabaseSession) {
        await session.eventStore.startStream(
            OrderStream,
            command.orderId,
            new OrderCompleteEvent(command.orderId),
        );
    }
}
