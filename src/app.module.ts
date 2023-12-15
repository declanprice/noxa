import { Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { NoxaModule, RabbitmqBus } from '../lib';
import { CustomersModule } from './customers/customers.module';
import { ProductCatalogModule } from './product-catalog/product-catalog.module';
import { InventoryModule } from './inventory/inventory.module';
import { PaymentsModule } from './payments/payments.module';
import { OrdersModule } from './orders/orders.module';
import { ShipmentModule } from './shipping/shipment.module';

@Module({
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
        CustomersModule,
        InventoryModule,
        PaymentsModule,
        OrdersModule,
        ShipmentModule,
        ProductCatalogModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
