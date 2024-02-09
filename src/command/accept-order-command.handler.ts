import {
    CommandHandler,
    CommandMessage,
    EventStore,
    HandleCommand,
    OutboxStore,
} from '../../lib';
import { OrderAcceptedEvent, OrderStream } from './order.stream';
import { DatabaseClient } from '../../lib/store/database-client.service';

export class AcceptOrderCommand {
    constructor(readonly orderId: string) {}
}

@CommandHandler(AcceptOrderCommand)
export class AcceptOrderCommandHandler implements HandleCommand {
    constructor(
        private readonly db: DatabaseClient,
        private readonly event: EventStore,
        private readonly outbox: OutboxStore,
    ) {}

    async handle(command: CommandMessage<AcceptOrderCommand>) {
        const { orderId } = command.data;

        const order = await this.event.hydrateStream(OrderStream, orderId);

        if (order.status === 'accepted') {
            return 'ok';
        }

        const event = new OrderAcceptedEvent(orderId);

        await this.db.$transaction(async (tx) => {
            await this.event.appendEvent(OrderStream, orderId, event);
            await this.outbox.event(event, { tx });
        });
    }
}
