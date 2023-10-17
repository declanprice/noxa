import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { NoxaModule, RabbitmqBus } from '../lib';
import { RegisterCustomerHandler } from './register-customer.handler';
import { CustomerProjection } from './customer.projection';
import { CustomerDocument } from './customer.document';
import { ChangeCustomerNameHandler } from './change-customer-name.handler';
import { CustomerGenericProjection } from './customer-generic.projection';

@Module({
  controllers: [AppController],
  providers: [
    RegisterCustomerHandler,
    ChangeCustomerNameHandler,
    CustomerProjection,
    CustomerGenericProjection,
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
