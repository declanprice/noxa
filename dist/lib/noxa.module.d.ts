import { DynamicModule, OnApplicationBootstrap } from '@nestjs/common';
import { HandlerExplorer } from './handlers';
import { BusImplementation, CommandBus } from './bus';
import { EventBus } from './bus/services/event-bus.service';
import { QueryBus } from './bus/services/query-bus.service';
export type NoxaModuleOptions = {
    postgres: {
        connectionUrl: string;
    };
    bus: BusImplementation;
} & NoxaConfig;
export type NoxaConfig = {
    context: string;
    asyncDaemon: {
        enabled: boolean;
    };
};
export declare class NoxaModule implements OnApplicationBootstrap {
    private readonly handlerExplorer;
    private readonly commandBus;
    private readonly queryBus;
    private readonly eventBus;
    constructor(handlerExplorer: HandlerExplorer, commandBus: CommandBus, queryBus: QueryBus, eventBus: EventBus);
    static forRoot(options: NoxaModuleOptions): DynamicModule;
    onApplicationBootstrap(): Promise<void>;
}
