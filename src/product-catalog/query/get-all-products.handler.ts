import { HandleQuery, QueryHandler } from '../../../lib';
import { products } from '../../schema';
import { GetAllProducts } from '../api/queries/get-all-products.query';

@QueryHandler(GetAllProducts)
export class GetAllProductsHandler extends HandleQuery {
    async handle(query: GetAllProducts) {
        return this.dataStore.query(products);
    }
}
