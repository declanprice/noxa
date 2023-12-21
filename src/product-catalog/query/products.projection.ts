import { DataProjection, ProjectionEventHandler } from '../../../lib';
import { Product, productsTable } from '../../schema';
import { ProductAddedToCatalog } from '../api/events/product-added-to-catalog.event';
import { ProductRemovedFromCatalog } from '../api/events/product-removed-from-catalog.event';

@DataProjection(productsTable)
export class ProductsProjection {
    @ProjectionEventHandler(ProductAddedToCatalog, (e) => e.productId)
    onRegistered(event: ProductAddedToCatalog): Product {
        return {
            id: event.productId,
            inventoryId: event.inventoryId,
            name: event.name,
            description: event.name,
            category: event.category,
            price: event.price,
            photoUrl: event.photoUrl,
            removed: false,
        };
    }

    @ProjectionEventHandler(ProductRemovedFromCatalog, (e) => e.id)
    onRemoved(event: ProductRemovedFromCatalog, existing: Product): Product {
        return {
            ...existing,
            removed: true,
        };
    }
}
