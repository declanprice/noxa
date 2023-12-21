import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { ValidateInventoryCommand } from '../api/commands/validate-inventory.command';
import { InventoryValidationSuccessEvent } from '../api/events/inventory-validation-success.event';
import { InventoryValidationFailedEvent } from '../api/events/inventory-validation-failed.event';
import { inventoryTable } from '../../schema';

@CommandHandler(ValidateInventoryCommand)
export class ValidateInventoryHandler extends HandleCommand {
    async handle(command: ValidateInventoryCommand, session: DatabaseSession) {
        const orderId = command.orderId;
        const validateInventory = command.inventory;

        let isValid = true;

        for (const { inventoryId, quantity } of validateInventory) {
            const foundInventory = await session.dataStore.get(
                inventoryTable,
                inventoryId,
            );

            if (foundInventory.quantityAvailable - quantity < 0) {
                isValid = false;
            }
        }

        if (isValid) {
            await session.outboxStore.publishEvent(
                new InventoryValidationSuccessEvent(orderId),
            );
        } else {
            await session.outboxStore.publishEvent(
                new InventoryValidationFailedEvent(orderId),
            );
        }
    }
}
