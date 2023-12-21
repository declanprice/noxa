import { QueryBus } from '../../../lib';
import * as DataLoader from 'dataloader';
import { Inventory } from '../model/inventory.model';
import { FindInventoryByIdsQuery } from '../../inventory/api/queries/find-inventory-by-ids.query';

export class DataLoaderService {
    constructor(readonly queryBus: QueryBus) {}

    resolveInventory() {
        return new DataLoader<string, Inventory>(async (ids: any) => {
            const inventory: Inventory[] = await this.queryBus.invoke(
                new FindInventoryByIdsQuery(ids),
            );

            const map = this.mapFromArray(inventory, (i: Inventory) => i.id);

            return ids.map((id: string) => map[id]);
        });
    }

    mapFromArray<T>(array: T[], keyStrategy: (v: T) => string | number) {
        const map: Record<string | number, T | undefined> = {};

        for (const item of array) {
            map[keyStrategy(item)] = item;
        }

        return map;
    }
}
