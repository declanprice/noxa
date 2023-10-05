import { Query } from './query.type';
export type HandleQuery<TQuery extends Query = any, TResult = any> = {
    handle(query: Query): Promise<TResult>;
};
