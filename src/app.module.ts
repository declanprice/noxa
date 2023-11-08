import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { NoxaModule, RabbitmqBus } from '../lib';
import { AppController } from './app.controller';
import { RegisterCustomerHandler } from './command/handlers/register-customer.handler';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { GetCustomersHandler } from './query/handlers/get-customers.handler';
import { ChangeCustomerNameHandler } from './command/handlers/change-customer-name.handler';
import { CustomerProjection } from './query/projections/customer.projection';
import { CustomerRegisteredHandler } from './event/handlers/customer-registered.handler';

@Module({
    controllers: [AppController],
    providers: [
        RegisterCustomerHandler,
        ChangeCustomerNameHandler,
        CustomerRegisteredHandler,
        GetCustomersHandler,
        CustomerProjection,
    ],
    imports: [
        NoxaModule.forRoot({
            serviceName: 'Restaurant',
            database: drizzle(
                new Pool({
                    connectionString:
                        'postgres://postgres:postgres@localhost:5432',
                }),
                { schema },
            ),
            bus: new RabbitmqBus({
                connectionUrl: 'amqp://localhost:5672',
            }),
            asyncDaemon: {
                enabled: true,
            },
        }),
        LoggerModule.forRoot({}),
    ],
})
export class ApplicationModule {}
