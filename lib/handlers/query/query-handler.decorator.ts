import { Query } from './query.type';

export const QUERY_HANDLER_METADATA = 'QUERY_HANDLER_METADATA';

export const QueryHandler = (
  query: Query | (new (...args: any[]) => Query),
): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(QUERY_HANDLER_METADATA, query, target);
  };
};
