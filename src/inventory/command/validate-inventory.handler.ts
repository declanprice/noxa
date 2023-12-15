import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { InventoryStream } from './inventory.stream';
import { ValidateInventoryCommand } from '../api/commands/validate-inventory.command';
import { InventoryValidatedEvent } from '../api/events/inventory-validated.event';
import { InventoryValidationFailedEvent } from '../api/events/inventory-validation-failed.event';

@CommandHandler(ValidateInventoryCommand)
export class ValidateInventoryHandler extends HandleCommand {
    async handle(command: ValidateInventoryCommand, session: DatabaseSession) {
        const { orderId, inventory } = command;

        let isValid = true;

        for (const { inventoryId, quantity } of inventory) {
            const hydratedInventory = await session.eventStore.hydrateStream(
                InventoryStream,
                inventoryId,
            );

            if (hydratedInventory.quantityAvailable - quantity < 0) {
                isValid = false;
            }
        }

        if (isValid) {
            await session.outboxStore.publishEvent(
                new InventoryValidatedEvent(orderId),
            );
        } else {
            await session.outboxStore.publishEvent(
                new InventoryValidationFailedEvent(orderId),
            );
        }
    }
}
