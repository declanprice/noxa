import { DynamicModule, OnApplicationBootstrap } from '@nestjs/common';
import { HandlerExplorer } from './handlers';
import { BusRelay, CommandBus, QueryBus, EventBus } from './bus';
import { Config } from './config';
export type NoxaModuleOptions = {
    postgres: {
        connectionUrl: string;
    };
    bus: BusRelay;
} & Config;
export declare class NoxaModule implements OnApplicationBootstrap {
    private readonly handlerExplorer;
    private readonly commandBus;
    private readonly queryBus;
    private readonly eventBus;
    private readonly busRelay;
    private readonly config;
    constructor(handlerExplorer: HandlerExplorer, commandBus: CommandBus, queryBus: QueryBus, eventBus: EventBus, busRelay: BusRelay, config: Config);
    static forRoot(options: NoxaModuleOptions): DynamicModule;
    onApplicationBootstrap(): Promise<void>;
}
