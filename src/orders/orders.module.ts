import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { RequestOrderHandler } from './command/request-order.handler';
import { GetOrderByIdHandler } from './query/get-order-by-id.handler';
import { OrdersProjection } from './query/orders.projection';

@Module({
    imports: [RequestOrderHandler, GetOrderByIdHandler, OrdersProjection],
    controllers: [OrdersController],
    providers: [],
})
export class OrdersModule {}
