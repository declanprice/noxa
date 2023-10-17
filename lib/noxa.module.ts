import {
  DynamicModule,
  Module,
  OnApplicationBootstrap,
  Type,
} from '@nestjs/common';
import { HandlerExplorer, ProjectionType } from './handlers';
import {
  BUS_RELAY_TOKEN,
  BusRelay,
  CommandBus,
  EventBus,
  InjectBusRelay,
  QueryBus,
} from './bus';
import { Config, CONFIG_TOKEN, InjectConfig } from './config';
import {
  DocumentStore,
  EventStore,
  InjectStoreConnection,
  OutboxStore,
  STORE_CONNECTION_TOKEN,
  StoreSession,
} from './store';
import { Pool } from 'pg';
import { AsyncDaemon } from './async-daemon/async-daemon';
import {
  PROJECTION_HANDLER,
  ProjectionOptions,
} from './handlers/projection/projection.decorators';

export type NoxaModuleOptions = {
  postgres: {
    connectionUrl: string;
  };
  bus: BusRelay;
  documentTypes?: Type[];
} & Config;

@Module({
  exports: [
    CommandBus,
    QueryBus,
    EventBus,
    DocumentStore,
    EventStore,
    OutboxStore,
    StoreSession,
  ],
  providers: [
    CommandBus,
    QueryBus,
    EventBus,
    DocumentStore,
    EventStore,
    OutboxStore,
    StoreSession,
    AsyncDaemon,
    HandlerExplorer,
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
    @InjectStoreConnection() private readonly pool: Pool,
  ) {}

  public static forRoot(options: NoxaModuleOptions): DynamicModule {
    return {
      module: NoxaModule,
      providers: [
        {
          provide: STORE_CONNECTION_TOKEN,
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
    const {
      commandHandlers,
      queryHandlers,
      eventHandlers,
      projectionHandlers,
    } = this.handlerExplorer.explore();

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

    if (projectionHandlers) {
      for (const projectionType of projectionHandlers) {
        const options = Reflect.getMetadata(
          PROJECTION_HANDLER,
          projectionType,
        ) as ProjectionOptions;

        if (options.type === ProjectionType.Document) {
          await DocumentStore.createResources(projectionType, connection);
        }
      }

      if (this.config.asyncDaemon.enabled) {
        this.asyncDaemon.start(projectionHandlers).then();
      }
    }
  }
}
