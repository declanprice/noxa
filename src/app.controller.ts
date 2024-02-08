import { Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '../lib';
import { CreateOrderCommand } from './command/place-order-command.handler';
import { GetOrdersQuery } from './query/get-orders-query.handler';
import { AcceptOrderCommand } from './command/accept-order-command.handler';

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

    @Post('/orders/:orderId/accept')
    async acceptOrder(@Param('orderId') orderId: string) {
        return this.commandBus.invoke(new AcceptOrderCommand(orderId));
    }
}
