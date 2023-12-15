import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { OrderStream } from './order.stream';
import { OrderRequestedEvent } from '../api/events/order-requested.event';
import { RequestOrderCommand } from '../api/commands/request-order.command';

@CommandHandler(RequestOrderCommand)
export class RequestOrderHandler extends HandleCommand {
    async handle(command: RequestOrderCommand, session: DatabaseSession) {
        await session.eventStore.startStream(
            OrderStream,
            command.orderId,
            new OrderRequestedEvent(
                command.orderId,
                command.customerId,
                command.paymentId,
                command.lineItems,
            ),
        );
    }
}
