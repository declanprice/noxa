import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { NoxaModule, RabbitmqBus } from '../lib';
import { AppController } from './app.controller';
import {
    ChangeCustomerAgeCommandHandler,
    ChangeCustomerNameHandler,
    RegisterCustomerHandler,
} from './handlers/command/customer.command-handlers';
import { CustomerEventsHandler } from './handlers/event/customer.events-handler';
import { CustomerRegisteredEventHandler } from './handlers/event/customer-registered.event-handler';
import { CustomerProjection } from './projections/customer.projection';
import { CustomerSaga } from './sagas/customer.saga';

@Module({
    controllers: [AppController],
    providers: [
        RegisterCustomerHandler,
        ChangeCustomerNameHandler,
        CustomerEventsHandler,
        CustomerRegisteredEventHandler,
        ChangeCustomerAgeCommandHandler,
        CustomerProjection,
        CustomerSaga,
    ],
    imports: [
        NoxaModule.forRoot({
            serviceName: 'Restaurant',
            postgres: {
                connectionUrl: 'postgres://postgres:postgres@localhost:5432',
            },
            bus: new RabbitmqBus({
                connectionUrl: 'amqp://localhost:5672',
            }),
            asyncDaemon: {
                enabled: true,
            },
        }),
        LoggerModule.forRoot({
            // pinoHttp: {
            //   transport: {
            //     target: 'pino-pretty',
            //     options: {
            //       levelFirst: true,
            //       colorize: true,
            //       ignore: 'pid,res',
            //     },
            //   },
            // },
        }),
    ],
})
export class ApplicationModule {}
