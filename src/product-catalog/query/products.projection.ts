import { DataProjection, ProjectionEventHandler } from '../../../lib';
import { Product, products } from '../../schema';
import { ProductAddedToCatalog } from '../api/events/product-added-to-catalog.event';
import { ProductRemovedFromCatalog } from '../api/events/product-removed-from-catalog.event';

@DataProjection(products)
export class ProductsProjection {
    @ProjectionEventHandler(ProductAddedToCatalog, (e) => e.id)
    onRegistered(event: ProductAddedToCatalog): Product {
        return {
            id: event.id,
            name: event.name,
            description: event.name,
            category: event.category,
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
