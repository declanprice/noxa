import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HandleQuery, Query } from '../../handlers';
import { QUERY_HANDLER_METADATA } from '../../handlers/query/query-handler.decorator';

@Injectable({})
export class QueryBus {
  private handlers = new Map<string, HandleQuery<Query>>();

  logger = new Logger(QueryBus.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  invoke(query: Query) {
    const queryName = this.getQueryName(query);

    const handler = this.handlers.get(queryName);

    if (!handler) {
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
    const query: Type<Query> = Reflect.getMetadata(
      QUERY_HANDLER_METADATA,
      handler,
    );

    const instance = this.moduleRef.get(handler, { strict: false });

    if (!instance) {
      throw new Error(
        `module ref could not resolve ${handler}, make sure it has been provided`,
      );
    }

    this.handlers.set(query.name, instance);
  }

  private getQueryName(query: Query): string {
    const { constructor } = Object.getPrototypeOf(query);

    return constructor.name as string;
  }
}
