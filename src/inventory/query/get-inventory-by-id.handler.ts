import { HandleQuery, QueryHandler } from '../../../lib';
import { inventoryTable } from '../../schema';
import { GetInventoryByIdQuery } from '../api/queries/get-inventory-by-id.query';

@QueryHandler(GetInventoryByIdQuery)
export class GetInventoryByIdHandler extends HandleQuery {
    async handle(query: GetInventoryByIdQuery) {
        return this.dataStore.get(inventoryTable, query.id);
    }
}
