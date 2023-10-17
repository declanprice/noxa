import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { NoxaModule, RabbitmqBus } from '../lib';
import { AppController } from './app.controller';
import { CustomerProjection } from './handlers/projection/customer.projection';
import { CustomerDocument } from './documents/customer.document';
import {
  ChangeCustomerNameHandler,
  RegisterCustomerHandler,
} from './handlers/command/customer.command-handlers';
import {
  CustomerNameChangedEventHandler,
  CustomerRegisteredEventHandler,
} from './handlers/event/customer.event-handlers';

@Module({
  controllers: [AppController],
  providers: [
    RegisterCustomerHandler,
    ChangeCustomerNameHandler,
    CustomerRegisteredEventHandler,
    CustomerNameChangedEventHandler,
    CustomerProjection,
  ],
  imports: [
    NoxaModule.forRoot({
      context: 'Customer',
      postgres: {
        connectionUrl: 'postgres://postgres:postgres@localhost:5432',
      },
      bus: new RabbitmqBus({
        connectionUrl: 'amqp://localhost:5672',
      }),
      asyncDaemon: {
        enabled: true,
      },
      documentTypes: [CustomerDocument],
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
