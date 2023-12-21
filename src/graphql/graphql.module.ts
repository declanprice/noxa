import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import * as path from 'path';
import { Module } from '@nestjs/common';
import { ProductResolver } from './resolvers/product.resolver';
import { InventoryResolver } from './resolvers/inventory.resolver';
import { DataLoaderService } from './dataloader/data-loader.service';
import { QueryBus } from '../../lib';

@Module({
    providers: [ProductResolver, InventoryResolver],
    imports: [
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
            driver: ApolloDriver,
            useFactory: (queryBus: QueryBus) => ({
                autoSchemaFile: path.join(process.cwd(), 'src/schema.gql'),
                playground: true,
                context: () => {
                    const loader = new DataLoaderService(queryBus);

                    return {
                        resolveInventory: loader.resolveInventory(),
                    };
                },
            }),
            inject: [QueryBus],
        }),
    ],
})
export class GraphqlModule {}
