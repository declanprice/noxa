import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { BadRequestException } from '@nestjs/common';
import { InventoryStream } from './inventory.stream';
import { UnStockInventoryCommand } from '../api/commands/unstock-inventory.command';
import { InventoryUnStockedEvent } from '../api/events/inventory-unstocked.event';

@CommandHandler(UnStockInventoryCommand)
export class UnStockInventoryHandler extends HandleCommand {
    async handle(command: UnStockInventoryCommand, session: DatabaseSession) {
        const inventory = await session.eventStore.hydrateStream(
            InventoryStream,
            command.inventoryId,
        );

        if (inventory.quantityAvailable - command.quantity < 0) {
            throw new BadRequestException(
                'inventory count cannot be less than 0',
            );
        }

        await session.eventStore.appendEvent(
            InventoryStream,
            command.inventoryId,
            new InventoryUnStockedEvent(command.inventoryId, command.quantity),
        );
    }
}
