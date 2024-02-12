import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HandleQuery, QueryMessage } from '../../handlers';
import { getQueryHandlerType } from '../../handlers/query/query-handler.decorator';

@Injectable({})
export class QueryBus {
    private handlers = new Map<string, HandleQuery>();

    logger = new Logger(QueryBus.name);

    constructor(private readonly moduleRef: ModuleRef) {}

    invoke(query: any) {
        const type = query.constructor.name;
        const data = query;

        const handler = this.handlers.get(type);

        if (!handler) {
            throw new Error(`@QueryHandler not found for ${type}`);
        }

        const queryMessage: QueryMessage<any> = {
            type,
            data,
        };

        return handler.handle(queryMessage);
    }

    async registerQueryHandlers(handlers: Type<HandleQuery>[] = []) {
        for (const handler of handlers) {
            await this.registerHandler(handler);
        }
    }

    private async registerHandler(handler: Type<HandleQuery>) {
        const type = getQueryHandlerType(handler);

        const instance = this.moduleRef.get(handler, { strict: false });

        if (!instance) {
            throw new Error(
                `module ref could not resolve ${handler}, make sure it has been provided`,
            );
        }

        this.handlers.set(type, instance);
    }
}
