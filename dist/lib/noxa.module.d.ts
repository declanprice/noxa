import { DynamicModule, OnApplicationBootstrap, Type } from '@nestjs/common';
import { HandlerExplorer } from './handlers';
import { BusRelay, CommandBus, EventBus, QueryBus } from './bus';
import { Config } from './config';
import { Pool } from 'pg';
import { AsyncDaemon } from './async-daemon/async-daemon';
export type NoxaModuleOptions = {
    postgres: {
        connectionUrl: string;
    };
    bus: BusRelay;
    documentTypes?: Type[];
} & Config;
export declare class NoxaModule implements OnApplicationBootstrap {
    private readonly handlerExplorer;
    private readonly commandBus;
    private readonly queryBus;
    private readonly eventBus;
    private readonly asyncDaemon;
    private readonly busRelay;
    private readonly config;
    private readonly pool;
    constructor(handlerExplorer: HandlerExplorer, commandBus: CommandBus, queryBus: QueryBus, eventBus: EventBus, asyncDaemon: AsyncDaemon, busRelay: BusRelay, config: Config, pool: Pool);
    static forRoot(options: NoxaModuleOptions): DynamicModule;
    onApplicationBootstrap(): Promise<void>;
}
