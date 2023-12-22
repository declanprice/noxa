import { BadRequestException } from '@nestjs/common';

import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { ProductStream } from './product.stream';
import { RemoveProductFromCatalog } from '../api/commands/remove-product-from-catalog.command';
import { ProductRemovedFromCatalog } from '../api/events/product-removed-from-catalog.event';

@CommandHandler(RemoveProductFromCatalog)
export class RemoveProductFromCatalogHandler extends HandleCommand {
    async handle(command: RemoveProductFromCatalog, session: DatabaseSession) {
        const product = await session.eventStore.hydrateStream(
            ProductStream,
            command.id,
        );

        if (product.removed) {
            throw new BadRequestException('product-shop is already removed');
        }

        await session.eventStore.appendEvent(
            ProductStream,
            command.id,
            new ProductRemovedFromCatalog(command.id),
        );
    }
}
