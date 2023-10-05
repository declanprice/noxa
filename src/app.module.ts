import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { NoxaModule, RabbitmqBus } from '../lib';
import { LoggerModule } from 'nestjs-pino';
import { RegisterCustomerHandler } from './register-customer.handler';

@Module({
  imports: [
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
    NoxaModule.forRoot({
      context: 'customer',
      postgresConnectionUrl: '',
      bus: new RabbitmqBus(''),
      autoCreateResources: true,
      asyncDaemon: {
        enabled: true,
      },
    }),
  ],
  controllers: [AppController],
  providers: [RegisterCustomerHandler],
})
export class ApplicationModule {}
