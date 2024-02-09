import { Module } from '@nestjs/common';
import { NoxaModule, RabbitmqBus } from '../lib';
import { AppController } from './app.controller';
import { PlaceOrderCommandHandler } from './command/place-order-command.handler';
import { OrderProjection } from './projection/order.projection';
import { GetOrdersQueryHandler } from './query/get-orders-query.handler';
import { AcceptOrderCommandHandler } from './command/accept-order-command.handler';
import { OrderProcess } from './process/order.process';

@Module({
    imports: [
        NoxaModule.forRoot({
            serviceName: 'Shop',
            bus: new RabbitmqBus({
                connectionUrl: 'amqp://localhost:5672',
            }),
            asyncDaemon: {
                enabled: true,
            },
        }),
    ],
    controllers: [AppController],
    providers: [
        PlaceOrderCommandHandler,
        AcceptOrderCommandHandler,
        OrderProjection,
        // OrderEventsHandler,
        // OrderPlacedEventHandler,
        OrderProcess,
        GetOrdersQueryHandler,
    ],
})
export class AppModule {}
