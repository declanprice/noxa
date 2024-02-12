import { QueryMessage } from './query.type';

export abstract class HandleQuery {
    abstract handle(query: QueryMessage<any>): Promise<any>;
}
