import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { NoxaModule, RabbitmqBus } from '../lib';
import { AppController } from './app.controller';
import { CustomerDocument } from './model/documents/customer.document';
import {
  ChangeCustomerAgeCommandHandler,
  ChangeCustomerNameHandler,
  RegisterCustomerHandler,
} from './handlers/command/customer.command-handlers';
import {
  CustomerNameChangedEventHandler,
  CustomerRegisteredEventHandler,
} from './handlers/event/customer.event-handlers';
import { CustomerSaga } from './handlers/saga/customer.saga';

@Module({
  controllers: [AppController],
  providers: [
    RegisterCustomerHandler,
    ChangeCustomerNameHandler,
    CustomerRegisteredEventHandler,
    CustomerNameChangedEventHandler,
    ChangeCustomerAgeCommandHandler,
    CustomerSaga,
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
      documents: [CustomerDocument],
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
