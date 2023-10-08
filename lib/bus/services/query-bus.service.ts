import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HandleQuery, Query } from '../../handlers';
import {
  QUERY_HANDLER_METADATA,
  QUERY_METADATA,
} from '../../handlers/constants';
import { QueryMetadata } from '../../handlers/query/query-metadata.type';

@Injectable({})
export class QueryBus {
  private handlers = new Map<string, HandleQuery<Query>>();

  logger = new Logger(QueryBus.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  invoke(query: Query) {
    const queryId = this.getQueryId(query);

    const handler = this.handlers.get(queryId);

    if (!handler) {
      const queryName = this.getQueryName(query);
      throw new Error(`query handler not found for ${queryName}`);
    }

    return handler.handle(query);
  }

  async register(handlers: Type<HandleQuery>[] = []) {
    for (const handler of handlers) {
      await this.registerHandler(handler);
    }
  }

  protected async registerHandler(handler: Type<HandleQuery>) {
    const instance = this.moduleRef.get(handler, { strict: false });

    if (!instance) {
      return;
    }

    const target = this.reflectQueryId(handler);

    if (!target) {
      throw new Error('invalid query handler');
    }

    this.handlers.set(target, instance);
  }

  private getQueryName(query: Query): string {
    const { constructor } = Object.getPrototypeOf(query);

    return constructor.name as string;
  }

  private getQueryId(query: Query): string {
    const { constructor: queryType } = Object.getPrototypeOf(query);

    const queryMetaData: QueryMetadata = Reflect.getMetadata(
      QUERY_METADATA,
      queryType,
    );

    if (!queryMetaData) {
      throw new Error('query handler not found');
    }

    return queryMetaData.id;
  }

  private reflectQueryId(handler: Type<HandleQuery>): string | undefined {
    const query: Query = Reflect.getMetadata(QUERY_HANDLER_METADATA, handler);

    const queryMetadata: QueryMetadata = Reflect.getMetadata(
      QUERY_METADATA,
      query,
    );

    return queryMetadata.id;
  }
}
