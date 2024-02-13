import { Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, EventStore, QueryBus } from '../lib';
import { CreateOrderCommand } from './command/place-order-command.handler';
import { GetOrdersQuery } from './query/get-orders-query.handler';
import { AcceptOrderCommand } from './command/accept-order-command.handler';
import {
    OrderAcceptedEvent,
    OrderPlacedEvent,
    OrderStream,
} from './command/order.stream';
import { v4 } from 'uuid';
import { DatabaseClient } from '../lib/store/database-client.service';

@Controller('/')
export class AppController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly eventStore: EventStore,
        private readonly db: DatabaseClient,
    ) {}

    @Get('/orders')
    async getOrders() {
        return this.queryBus.invoke(new GetOrdersQuery());
    }

    @Post('/orders')
    async placeOrder() {
        return this.commandBus.invoke(
            new CreateOrderCommand(['item1', 'item2'], '1'),
        );
    }

    @Post('/orders/:orderId/accept')
    async acceptOrder(@Param('orderId') orderId: string) {
        return this.commandBus.invoke(new AcceptOrderCommand(orderId));
    }

    @Post('/create-events')
    async createEvents() {
        for (let i = 0; i < 2500; i++) {
            try {
                await this.db.$transaction(async (tx) => {
                    const streamId = v4();

                    await this.eventStore.startStream(
                        OrderStream,
                        streamId,
                        new OrderPlacedEvent(streamId, [], `${i}`),
                        {
                            tx,
                        },
                    );

                    // if (i % 250 === 0) {
                    //     throw new Error('error');
                    // }

                    await this.eventStore.appendEvent(
                        OrderStream,
                        streamId,
                        new OrderAcceptedEvent(streamId),
                        { tx },
                    );
                });
            } catch (error) {
                console.log(error);
            }
        }
    }

    @Post('/create-events2')
    async createEvents2() {
        await this.db.$transaction(async (tx) => {
            const streamId = v4();

            await this.eventStore.startStream(
                OrderStream,
                streamId,
                new OrderPlacedEvent(streamId, [], '1'),
                {
                    tx,
                },
            );

            await new Promise((res: any) => {
                setTimeout(() => {
                    res();
                }, 2500);
            });
        });
    }

    @Post('/cleardb')
    async clearDb() {
        await this.db.events.deleteMany();
        await this.db.streams.deleteMany();
        await this.db.orders.deleteMany();
        await this.db.tokens.deleteMany();
    }
}
