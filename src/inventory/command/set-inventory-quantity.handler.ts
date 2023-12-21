import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { SetInventoryQuantityCommand } from '../api/commands/set-inventory-quantity.command';
import { inventoryTable } from '../../schema';

@CommandHandler(SetInventoryQuantityCommand)
export class SetInventoryQuantityHandler extends HandleCommand {
    async handle(
        command: SetInventoryQuantityCommand,
        session: DatabaseSession,
    ) {
        return session.dataStore.store(inventoryTable, {
            id: command.inventoryId,
            quantityAvailable: command.quantity,
        });
    }
}
