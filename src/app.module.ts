import { Module } from '@nestjs/common';
import { NoxaModule, RabbitmqBus } from '../lib';

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
    controllers: [],
    providers: [],
})
export class AppModule {}
