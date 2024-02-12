import { randomUUID } from 'crypto';
import {
    CommandMessage,
    CommandHandler,
    HandleCommand,
    OutboxStore,
    EventStore,
} from '../../lib';
import { OrderPlacedEvent, OrderStream } from './order.stream';
import { DatabaseClient } from '../../lib/store/database-client.service';

export class CreateOrderCommand {
    constructor(
        readonly items: string[],
        readonly customerId: string,
    ) {}
}

@CommandHandler(CreateOrderCommand)
export class PlaceOrderCommandHandler implements HandleCommand {
    constructor(
        private readonly db: DatabaseClient,
        private readonly events: EventStore,
        private readonly outbox: OutboxStore,
    ) {}

    async handle(command: CommandMessage<CreateOrderCommand>) {
        const orderId = randomUUID();

        const event = new OrderPlacedEvent(
            orderId,
            command.data.items,
            command.data.customerId,
        );

        await this.db.$transaction(async (tx) => {
            await this.events.startStream(OrderStream, orderId, event, { tx });
            await this.outbox.event(event, { tx });
        });

        return {
            orderId,
        };
    }
}
