import { HandleQuery, QueryHandler } from '../../../lib';
import { products } from '../../schema';
import { GetProductById } from '../api/queries/get-product-by-id.query';

@QueryHandler(GetProductById)
export class GetProductByIdHandler extends HandleQuery {
    async handle(query: GetProductById) {
        return this.dataStore.get(products, query.id);
    }
}
