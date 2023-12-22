import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';

import * as path from 'path';
import { ProductResolver } from './resolvers/product.resolver';
import { InventoryResolver } from './resolvers/inventory.resolver';
import { DataLoaderService } from './dataloader/data-loader.service';
import { QueryBus } from '../../lib';
import { UserResolver } from './resolvers/user.resolver';

@Module({
    providers: [ProductResolver, InventoryResolver, UserResolver],
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
