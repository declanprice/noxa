import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { NoxaModule, RabbitmqBus } from '../lib';
import { RegisterCustomerHandler } from './register-customer.handler';

@Module({
  controllers: [AppController],
  providers: [RegisterCustomerHandler],
  imports: [
    NoxaModule.forRoot({
      context: 'customerService',
      postgres: {
        connectionUrl: '',
      },
      bus: new RabbitmqBus({
        connectionUrl: 'amqp://localhost:5672',
      }),
      asyncDaemon: {
        enabled: true,
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            levelFirst: true,
            colorize: true,
            ignore: 'pid,res',
          },
        },
      },
    }),
  ],
})
export class ApplicationModule {}
