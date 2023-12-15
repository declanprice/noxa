import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { AddInventoryHandler } from './command/add-inventory.handler';
import { GetInventoryByIdHandler } from './query/get-inventory-by-id.handler';
import { InventoryProjection } from './query/inventory.projection';
import { StockInventoryHandler } from './command/stock-inventory.handler';
import { UnStockInventoryHandler } from './command/unstock-inventory.handler';

@Module({
  imports: [
    AddInventoryHandler,
    StockInventoryHandler,
    UnStockInventoryHandler,
    GetInventoryByIdHandler,
    InventoryProjection,
  ],
  controllers: [InventoryController],
  providers: [],
})
export class InventoryModule {}
