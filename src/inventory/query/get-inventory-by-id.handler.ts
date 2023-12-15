import { HandleQuery, QueryHandler } from '../../../lib';
import { inventory } from '../../schema';
import { GetInventoryByIdQuery } from '../api/queries/get-inventory-by-id.query';

@QueryHandler(GetInventoryByIdQuery)
export class GetInventoryByIdHandler extends HandleQuery {
    async handle(query: GetInventoryByIdQuery) {
        return this.dataStore.get(inventory, query.id);
    }
}
