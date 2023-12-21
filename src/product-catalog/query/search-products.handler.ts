import { HandleQuery, QueryHandler } from '../../../lib';
import { productsTable } from '../../schema';
import { SearchProductsQuery } from '../api/queries/search-products.query';
import { eq } from 'drizzle-orm';

@QueryHandler(SearchProductsQuery)
export class SearchProductsHandler extends HandleQuery {
    async handle(query: SearchProductsQuery) {
        if (query.params?.name) {
            return this.dataStore
                .query(productsTable)
                .where(eq(productsTable.name, query.params.name));
        }

        return this.dataStore.query(productsTable);
    }
}
