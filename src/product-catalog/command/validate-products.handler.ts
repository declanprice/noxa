import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { ProductStream } from './product.stream';
import { ValidateProductsCommand } from '../api/commands/validate-products.command';
import { ProductsValidatedEvent } from '../api/events/products-validated.event';
import { ProductsValidationFailedEvent } from '../api/events/products-validation-failed.event';

@CommandHandler(ValidateProductsCommand)
export class ValidateProductsHandler extends HandleCommand {
    async handle(command: ValidateProductsCommand, session: DatabaseSession) {
        const { orderId, products } = command;

        let isValid = true;

        for (const { productId, inventoryId, price } of products) {
            const product = await session.eventStore.hydrateStream(
                ProductStream,
                productId,
            );

            if (
                product.inventoryId !== inventoryId ||
                product.price !== price
            ) {
                isValid = false;
            }
        }

        if (isValid) {
            return await session.outboxStore.publishEvent(
                new ProductsValidatedEvent(orderId),
            );
        } else {
            await session.outboxStore.publishEvent(
                new ProductsValidationFailedEvent(orderId),
            );
        }
    }
}
