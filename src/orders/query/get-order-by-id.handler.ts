import { HandleQuery, QueryHandler } from '../../../lib';
import { customersTable } from '../../schema';
import { GetOrderByIdQuery } from '../api/queries/get-order-by-id.query';

@QueryHandler(GetOrderByIdQuery)
export class GetOrderByIdHandler extends HandleQuery {
    async handle(query: GetOrderByIdQuery) {
        return this.dataStore.get(customersTable, query.id);
    }
}
