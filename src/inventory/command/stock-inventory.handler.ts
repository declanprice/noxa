import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { InventoryStream } from './inventory.stream';
import { StockInventoryCommand } from '../api/commands/stock-inventory.command';
import { InventoryStockedEvent } from '../api/events/inventory-stocked.event';

@CommandHandler(StockInventoryCommand)
export class StockInventoryHandler extends HandleCommand {
    async handle(command: StockInventoryCommand, session: DatabaseSession) {
        const inventory = await session.eventStore.hydrateStream(
            InventoryStream,
            command.inventoryId,
        );

        await session.eventStore.appendEvent(
            InventoryStream,
            command.inventoryId,
            new InventoryStockedEvent(command.inventoryId, command.quantity),
        );
    }
}
