import { HandleQuery, QueryHandler } from '../../../lib';

import { customersTable } from '../../schema';

export class GetCustomersQuery {}

@QueryHandler(GetCustomersQuery)
export class GetCustomersHandler extends HandleQuery {
    async handle(query: GetCustomersQuery) {
        return this.dataStore.query(customersTable);
    }
}
