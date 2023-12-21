import {
    Resolver,
    Query,
    Args,
    ResolveField,
    Parent,
    Context,
} from '@nestjs/graphql';
import { Product } from '../model/product.model';
import { QueryBus } from '../../../lib';
import { GetProductById } from '../../product-catalog/api/queries/get-product-by-id.query';
import { SearchProductsQuery } from '../../product-catalog/api/queries/search-products.query';
import { Inventory } from '../model/inventory.model';
import * as DataLoader from 'dataloader';

@Resolver((of: any) => Product)
export class ProductResolver {
    constructor(readonly queryBus: QueryBus) {}

    @Query((returns) => Product)
    async product(@Args('id', { type: () => String }) id: string) {
        return this.queryBus.invoke(new GetProductById(id));
    }

    @Query((returns) => [Product])
    async searchProducts(
        @Args('name', { type: () => String, nullable: true }) name?: string,
    ) {
        console.log(name);

        return this.queryBus.invoke(
            new SearchProductsQuery({
                name,
            }),
        );
    }

    @ResolveField()
    async inventory(
        @Parent() product: Product,
        @Context('resolveInventory') loader: DataLoader<string, Inventory>,
    ) {
        const { id } = product;

        return loader.load(id);
    }
}
