import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { NoxaModule, RabbitmqBus } from '../lib';
import { AppController } from './app.controller';
import { CustomerProjection } from './handlers/projection/customer.projection';
import { CustomerDocument } from './model/documents/customer.document';
import {
  ChangeCustomerNameHandler,
  RegisterCustomerHandler,
} from './handlers/command/customer.command-handlers';
import {
  CustomerNameChangedEventHandler,
  CustomerRegisteredEventHandler,
} from './handlers/event/customer.event-handlers';
import { RandomService } from './services/random.service';
import { CustomerProcess } from './handlers/process/customer.process';

@Module({
  controllers: [AppController],
  providers: [
    RegisterCustomerHandler,
    ChangeCustomerNameHandler,
    CustomerRegisteredEventHandler,
    CustomerNameChangedEventHandler,
    RandomService,
    CustomerProjection,
    CustomerProcess,
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
