import { Module } from '@nestjs/common';
import { ProductCatalogController } from './product-catalog.controller';
import { AddProductToCatalogHandler } from './command/add-product-to-catalog.handler';
import { GetProductByIdHandler } from './query/get-product-by-id.handler';
import { GetAllProductsHandler } from './query/get-all-products.handler';
import { ProductsProjection } from './query/products.projection';
import { RemoveProductFromCatalogHandler } from './command/remove-product-from-catalog.handler';

@Module({
  imports: [
    AddProductToCatalogHandler,
    RemoveProductFromCatalogHandler,
    GetProductByIdHandler,
    GetAllProductsHandler,
    ProductsProjection,
  ],
  controllers: [ProductCatalogController],
  providers: [],
})
export class ProductCatalogModule {}
