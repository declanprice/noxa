import { HandleQuery, QueryHandler } from '../../../lib';

import { customers } from '../../schema';

export class GetCustomersQuery {}

@QueryHandler(GetCustomersQuery)
export class GetCustomersHandler extends HandleQuery {
    async handle(query: GetCustomersQuery) {
        return this.dataStore.query(customers);
    }
}
