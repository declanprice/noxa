import { Logger, Type } from '@nestjs/common';
import { HandleQuery, Query } from '../../handlers';
import { ModuleRef } from '@nestjs/core';
export declare class QueryBus {
    private readonly moduleRef;
    private handlers;
    logger: Logger;
    constructor(moduleRef: ModuleRef);
    invoke(query: Query): Promise<any>;
    register(handlers?: Type<HandleQuery>[]): Promise<void>;
    protected registerHandler(handler: Type<HandleQuery>): Promise<void>;
    private getQueryName;
    private getQueryId;
    private reflectQueryId;
}
