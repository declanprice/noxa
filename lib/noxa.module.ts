import { DynamicModule, Module, OnApplicationBootstrap } from '@nestjs/common';
import { HandlerExplorer } from './handlers';
import {
    BUS_RELAY_TOKEN,
    BusRelay,
    CommandBus,
    EventBus,
    InjectBusRelay,
    QueryBus,
} from './bus';
import { Config, CONFIG_TOKEN, InjectConfig } from './config';
import { DataStore, EventStore, OutboxStore } from './store';
// import { AsyncDaemon } from './async-daemon/async-daemon';
// import { HighWaterMarkAgent } from './async-daemon/high-water-mark-agent';

export type NoxaModuleOptions = {
    bus: BusRelay;
} & Config;

@Module({
    exports: [
        CommandBus,
        QueryBus,
        EventBus,
        DataStore,
        EventStore,
        OutboxStore,
    ],
    providers: [
        CommandBus,
        QueryBus,
        EventBus,
        DataStore,
        EventStore,
        OutboxStore,
        // AsyncDaemon,
        HandlerExplorer,
        // HighWaterMarkAgent,
    ],
})
export class NoxaModule implements OnApplicationBootstrap {
    constructor(
        private readonly handlerExplorer: HandlerExplorer,
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly eventBus: EventBus,
        // private readonly asyncDaemon: AsyncDaemon,
        @InjectBusRelay() private readonly busRelay: BusRelay,
        @InjectConfig() private readonly config: Config,
    ) {}

    public static forRoot(options: NoxaModuleOptions): DynamicModule {
        return {
            module: NoxaModule,
            exports: [],
            providers: [
                {
                    provide: BUS_RELAY_TOKEN,
                    useValue: options.bus,
                },
                {
                    provide: CONFIG_TOKEN,
                    useValue: {
                        serviceName: options.serviceName,
                        asyncDaemon: options.asyncDaemon,
                    } as Config,
                },
            ],
            global: true,
        };
    }

    async onApplicationBootstrap(): Promise<void> {
        const {
            commandHandlers,
            queryHandlers,
            dataProjectionHandlers,
            eventProjectionHandlers,
            eventHandlers,
            // eventGroupHandlers,
            // processHandlers,
        } = this.handlerExplorer.explore();

        await this.busRelay.init(this.config);
        await this.commandBus.registerCommandHandlers(commandHandlers);
        // await this.queryBus.registerQueryHandlers(queryHandlers);
        // await this.eventBus.registerEventHandlers(eventHandlers);
        // await this.eventBus.registerEventGroupHandlers(eventGroupHandlers);
        // await this.eventBus.registerProcessHandlers(processHandlers);
        //
        // if (this.config.asyncDaemon.enabled) {
        //     this.asyncDaemon
        //         .start({
        //             data: dataProjectionHandlers,
        //             event: eventProjectionHandlers,
        //         })
        //         .then();
        // }
    }
}
