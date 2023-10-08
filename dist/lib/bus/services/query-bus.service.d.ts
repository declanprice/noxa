import { Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HandleQuery, Query } from '../../handlers';
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
