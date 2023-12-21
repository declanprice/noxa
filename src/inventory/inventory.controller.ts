import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '../../lib';
import { SetInventoryQuantityCommand } from './api/commands/set-inventory-quantity.command';
import { v4 } from 'uuid';
import { GetInventoryByIdQuery } from './api/queries/get-inventory-by-id.query';
import { FindInventoryByIdsQuery } from './api/queries/find-inventory-by-ids.query';

@Controller('/inventory')
export class InventoryController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    async register(@Body() dto: any) {
        const inventoryId = v4();

        await this.commandBus.invoke(
            new SetInventoryQuantityCommand(inventoryId, dto.quantity),
        );

        return inventoryId;
    }

    @Get('/:id')
    getById(@Param('id') id: string) {
        return this.queryBus.invoke(new GetInventoryByIdQuery(id));
    }

    @Get('/')
    search(@Query() query?: any) {
        return this.queryBus.invoke(new FindInventoryByIdsQuery(query));
    }
}
