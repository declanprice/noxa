import { HandleQuery, QueryHandler } from '../../../lib';
import { inventoryTable } from '../../schema';
import { FindInventoryByIdsQuery } from '../api/queries/find-inventory-by-ids.query';

@QueryHandler(FindInventoryByIdsQuery)
export class FindInventoryByIdsHandler extends HandleQuery {
    async handle(query: FindInventoryByIdsQuery) {
        return this.dataStore.findMany(inventoryTable, query.ids);
    }
}
