import { Controller, Get, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '../lib';
import { CreateOrderCommand } from './command/place-order-command.handler';
import { GetOrdersQuery } from './query/get-orders-query.handler';

@Controller('/')
export class AppController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
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
}
