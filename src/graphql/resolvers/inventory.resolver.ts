import { Resolver, Query, Args, Mutation, Int } from '@nestjs/graphql';
import { CommandBus, QueryBus } from '../../../lib';
import { FindInventoryByIdsQuery } from '../../inventory/api/queries/find-inventory-by-ids.query';
import { GetInventoryByIdQuery } from '../../inventory/api/queries/get-inventory-by-id.query';
import { Inventory } from '../model/inventory.model';
import { SetInventoryQuantityCommand } from '../../inventory/api/commands/set-inventory-quantity.command';

@Resolver((of: any) => Inventory)
export class InventoryResolver {
    constructor(
        readonly commandBus: CommandBus,
        readonly queryBus: QueryBus,
    ) {}

    @Mutation((returns) => Inventory)
    async setInventoryQuantity(
        @Args({ name: 'id', type: () => String }) id: string,
        @Args({ name: 'quantity', type: () => Int }) quantity: number,
    ) {
        return this.commandBus.invoke(
            new SetInventoryQuantityCommand(id, quantity),
        );
    }

    @Query((returns) => Inventory)
    async inventoryById(@Args('id', { type: () => String }) id: string) {
        return this.queryBus.invoke(new GetInventoryByIdQuery(id));
    }

    @Query((returns) => [Inventory])
    async inventoryByIds(@Args('ids', { type: () => [String] }) ids: string[]) {
        return this.queryBus.invoke(new FindInventoryByIdsQuery(ids));
    }
}
