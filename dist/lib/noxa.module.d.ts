import { DynamicModule, OnApplicationBootstrap } from '@nestjs/common';
import { HandlerExplorer } from './handlers';
import { BusImplementation, CommandBus } from './bus';
export type NoxaModuleOptions = {
    context: string;
    postgresConnectionUrl: string;
    bus: BusImplementation;
    autoCreateResources?: boolean;
    asyncDaemon: {
        enabled: boolean;
    };
};
export declare class NoxaModule implements OnApplicationBootstrap {
    private readonly handlerExplorer;
    private readonly commandBus;
    constructor(handlerExplorer: HandlerExplorer, commandBus: CommandBus);
    static forRoot(options: NoxaModuleOptions): DynamicModule;
    onApplicationBootstrap(): any;
}
