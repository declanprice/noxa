import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { SetInventoryQuantityHandler } from './command/set-inventory-quantity.handler';
import { GetInventoryByIdHandler } from './query/get-inventory-by-id.handler';
import { FindInventoryByIdsHandler } from './query/find-inventory-by-ids.handler';

@Module({
    imports: [
        SetInventoryQuantityHandler,
        GetInventoryByIdHandler,
        FindInventoryByIdsHandler,
    ],
    controllers: [InventoryController],
    providers: [],
})
export class InventoryModule {}
