import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { NoxaModule, RabbitmqBus } from '../lib';
import {
  CustomerDocument,
  RegisterCustomerHandler,
} from './register-customer.handler';

@Module({
  controllers: [AppController],
  providers: [RegisterCustomerHandler],
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
