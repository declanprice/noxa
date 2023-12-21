import { Module } from '@nestjs/common';
import { ProductCatalogController } from './product-catalog.controller';
import { AddProductToCatalogHandler } from './command/add-product-to-catalog.handler';
import { GetProductByIdHandler } from './query/get-product-by-id.handler';
import { SearchProductsHandler } from './query/search-products.handler';
import { ProductsProjection } from './query/products.projection';
import { RemoveProductFromCatalogHandler } from './command/remove-product-from-catalog.handler';

@Module({
    imports: [
        AddProductToCatalogHandler,
        RemoveProductFromCatalogHandler,
        ProductsProjection,
        SearchProductsHandler,
        GetProductByIdHandler,
    ],
    controllers: [ProductCatalogController],
    providers: [],
})
export class ProductCatalogModule {}
