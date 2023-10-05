import { Query } from './query.type';
import { v4 } from 'uuid';
import { QUERY_HANDLER_METADATA, QUERY_METADATA } from '../constants';

export const QueryHandler = (
  query: Query | (new (...args: any[]) => Query),
): ClassDecorator => {
  return (target: object) => {
    if (!Reflect.hasOwnMetadata(QUERY_METADATA, query)) {
      Reflect.defineMetadata(QUERY_METADATA, { id: v4() }, query);
    }
    Reflect.defineMetadata(QUERY_HANDLER_METADATA, query, target);
  };
};
