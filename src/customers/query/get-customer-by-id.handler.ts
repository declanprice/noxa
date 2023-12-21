import { HandleQuery, QueryHandler } from '../../../lib';

import { GetCustomerById } from '../api/queries/get-customer-by-id.query';

import { customersTable } from '../../schema';

@QueryHandler(GetCustomerById)
export class GetCustomerByIdHandler extends HandleQuery {
    async handle(query: GetCustomerById) {
        return this.dataStore.get(customersTable, query.customerId);
    }
}
