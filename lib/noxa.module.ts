import {
    DynamicModule,
    Injectable,
    Module,
    OnApplicationBootstrap,
} from '@nestjs/common';
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
import { DataStore, EventStore, OutboxStore, DATABASE_TOKEN } from './store';
import { AsyncDaemon } from './async-daemon/async-daemon';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { HighWaterMarkAgent } from './async-daemon/high-water-mark-agent';

export type NoxaModuleOptions = {
    database: NodePgDatabase<any>;
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
        AsyncDaemon,
        HandlerExplorer,
        HighWaterMarkAgent,
    ],
})
export class NoxaModule implements OnApplicationBootstrap {
    constructor(
        private readonly handlerExplorer: HandlerExplorer,
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly eventBus: EventBus,
        private readonly asyncDaemon: AsyncDaemon,
        @InjectBusRelay() private readonly busRelay: BusRelay,
        @InjectConfig() private readonly config: Config,
    ) {}

    public static forRoot(options: NoxaModuleOptions): DynamicModule {
        return {
            module: NoxaModule,
            exports: [DATABASE_TOKEN],
            providers: [
                {
                    provide: DATABASE_TOKEN,
                    useValue: options.database,
                },
                {
                    provide: BUS_RELAY_TOKEN,
                    useValue: options.bus,
                },
                {
                    provide: CONFIG_TOKEN,
                    useValue: {
                        serviceName: options.serviceName,
                        asyncDaemon: options.asyncDaemon,
                        documents: options.documents,
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
            eventGroupHandlers,
            processHandlers,
            sagaHandlers,
        } = this.handlerExplorer.explore();

        await this.busRelay.init(this.config);
        await this.commandBus.registerCommandHandlers(commandHandlers);
        await this.queryBus.registerQueryHandlers(queryHandlers);
        await this.eventBus.registerEventHandlers(eventHandlers);
        await this.eventBus.registerEventGroupHandlers(eventGroupHandlers);
        await this.eventBus.registerProcessHandlers(processHandlers);
        await this.eventBus.registerSagaHandlers(sagaHandlers);

        if (this.config.asyncDaemon.enabled) {
            this.asyncDaemon
                .start({
                    data: dataProjectionHandlers,
                    event: eventProjectionHandlers,
                })
                .then();
        }
    }
}
