import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { OrderStream } from './order.stream';
import { PlaceOrderCommand } from '../api/commands/place-order.command';
import { OrderPlacedEvent } from '../api/events/order-placed.event';

@CommandHandler(PlaceOrderCommand)
export class PlaceOrderHandler extends HandleCommand {
    async handle(command: PlaceOrderCommand, session: DatabaseSession) {
        await session.eventStore.startStream(
            OrderStream,
            command.orderId,
            new OrderPlacedEvent(command.orderId),
        );
    }
}
