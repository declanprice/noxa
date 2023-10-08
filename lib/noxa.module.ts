import { DynamicModule, Module, OnApplicationBootstrap } from '@nestjs/common';
import { HandlerExplorer } from './handlers';
import {
  BUS_RELAY_TOKEN,
  BusRelay,
  CommandBus,
  QueryBus,
  EventBus,
  InjectBusRelay,
} from './bus';
import { Config, CONFIG_TOKEN, InjectConfig } from './config';
import {
  DocumentStore,
  EventStore,
  OutboxStore,
  MultiStoreSession,
  STORE_CONNECTION_POOL,
} from './store';
import { Pool } from 'pg';

export type NoxaModuleOptions = {
  postgres: {
    connectionUrl: string;
  };
  bus: BusRelay;
} & Config;

@Module({
  exports: [
    CommandBus,
    QueryBus,
    EventBus,
    DocumentStore,
    EventStore,
    OutboxStore,
    MultiStoreSession,
  ],
  providers: [
    CommandBus,
    QueryBus,
    EventBus,
    DocumentStore,
    EventStore,
    OutboxStore,
    MultiStoreSession,
    HandlerExplorer,
  ],
})
export class NoxaModule implements OnApplicationBootstrap {
  constructor(
    private readonly handlerExplorer: HandlerExplorer,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    @InjectBusRelay() private readonly busRelay: BusRelay,
    @InjectConfig() private readonly config: Config,
  ) {}

  public static forRoot(options: NoxaModuleOptions): DynamicModule {
    return {
      module: NoxaModule,
      providers: [
        {
          provide: STORE_CONNECTION_POOL,
          useValue: new Pool({
            connectionString: options.postgres.connectionUrl,
          }),
        },
        {
          provide: BUS_RELAY_TOKEN,
          useValue: options.bus,
        },
        {
          provide: CONFIG_TOKEN,
          useValue: {
            context: options.context,
            asyncDaemon: options.asyncDaemon,
          } as Config,
        },
      ],
      global: true,
    };
  }

  async onApplicationBootstrap(): Promise<void> {
    const { commandHandlers, queryHandlers, eventHandlers } =
      this.handlerExplorer.explore();

    await this.busRelay.init(this.config);

    await this.commandBus.register(commandHandlers);
    await this.queryBus.register(queryHandlers);
    await this.eventBus.register(eventHandlers);
  }
}
