import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { InventoryStream } from './inventory.stream';
import { AddInventoryCommand } from '../api/commands/add-inventory.command';
import { InventoryAddedEvent } from '../api/events/inventory-added.event';

@CommandHandler(AddInventoryCommand)
export class AddInventoryHandler extends HandleCommand {
    async handle(command: AddInventoryCommand, session: DatabaseSession) {
        await session.eventStore.startStream(
            InventoryStream,
            command.inventoryId,
            new InventoryAddedEvent(
                command.inventoryId,
                command.name,
                command.quantity,
            ),
        );
    }
}
