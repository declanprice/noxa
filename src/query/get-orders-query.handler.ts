import { HandleQuery, QueryHandler, QueryMessage } from '../../lib';
import { DatabaseClient } from '../../lib/store/database-client.service';

export class GetOrdersQuery {}

@QueryHandler(GetOrdersQuery)
export class GetOrdersQueryHandler implements HandleQuery {
    constructor(private readonly db: DatabaseClient) {}

    async handle(query: QueryMessage<GetOrdersQuery>) {
        return this.db.orders.findMany();
    }
}
