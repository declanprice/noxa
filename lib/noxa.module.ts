import {
  DynamicModule,
  Module,
  OnApplicationBootstrap,
  Type,
} from '@nestjs/common';
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
  StoreSession,
  STORE_CONNECTION_POOL,
  InjectStoreConnectionPool,
} from './store';
import { Pool } from 'pg';

export type NoxaModuleOptions = {
  postgres: {
    connectionUrl: string;
  };
  bus: BusRelay;
  documentTypes?: Type[];
} & Config;

@Module({
  exports: [CommandBus, QueryBus, EventBus, StoreSession],
  providers: [CommandBus, QueryBus, EventBus, StoreSession, HandlerExplorer],
})
export class NoxaModule implements OnApplicationBootstrap {
  constructor(
    private readonly handlerExplorer: HandlerExplorer,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    @InjectBusRelay() private readonly busRelay: BusRelay,
    @InjectConfig() private readonly config: Config,
    @InjectStoreConnectionPool() private readonly pool: Pool,
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
            documentTypes: options.documentTypes,
          } as Config,
        },
      ],
      global: true,
    };
  }

  async onApplicationBootstrap(): Promise<void> {
    const { commandHandlers, queryHandlers, eventHandlers } =
      this.handlerExplorer.explore();

    const connection = await this.pool.connect();

    try {
      await connection.query('BEGIN');
      await EventStore.createResources(connection);
      await OutboxStore.createResources(connection);

      for (const documentType of this.config.documentTypes || []) {
        await DocumentStore.createResources(documentType, connection);
      }

      await connection.query('COMMIT');
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }

    await this.busRelay.init(this.config);
    await this.commandBus.register(commandHandlers);
    await this.queryBus.register(queryHandlers);
    await this.eventBus.register(eventHandlers);
  }
}
