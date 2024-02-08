import {
    CommandHandler,
    CommandMessage,
    EventStore,
    HandleCommand,
} from '../../lib';
import { OrderAcceptedEvent, OrderStream } from './order.stream';

export class AcceptOrderCommand {
    constructor(readonly orderId: string) {}
}

@CommandHandler(AcceptOrderCommand)
export class AcceptOrderCommandHandler implements HandleCommand {
    constructor(private readonly event: EventStore) {}

    async handle(command: CommandMessage<AcceptOrderCommand>) {
        const { orderId } = command.data;

        const order = await this.event.hydrateStream(OrderStream, orderId);

        if (order.status === 'accepted') {
            return 'ok';
        }

        const event = new OrderAcceptedEvent(orderId);

        await this.event.appendEvent(OrderStream, orderId, event);
    }
}
