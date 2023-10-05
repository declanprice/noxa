import { Query } from './query.type';
export declare const QueryHandler: (query: Query | (new (...args: any[]) => Query)) => ClassDecorator;
