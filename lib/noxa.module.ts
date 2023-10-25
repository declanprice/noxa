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
import { DOCUMENT_PROJECTION_HANDLER } from './handlers/projection/projection.decorators';
import { getProcessDocumentMetadata } from './handlers/process/process.decorators';

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
      exports: [STORE_CONNECTION_TOKEN],
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
      eventHandlers,
      eventGroupHandlers,
      documentProjectionHandlers,
      eventProjectionHandlers,
      processHandlers,
      sagaHandlers,
    } = this.handlerExplorer.explore();

    const connection = await this.pool.connect();

    try {
      await connection.query('BEGIN');
      await EventStore.createResources(connection);
      await OutboxStore.createResources(connection);

      for (const documentType of this.config.documents || []) {
        await DocumentStore.createResources(documentType, connection);
      }

      if (documentProjectionHandlers) {
        for (const documentProjection of documentProjectionHandlers) {
          await DocumentStore.createResources(documentProjection, connection);
        }
      }

      if (processHandlers) {
        for (const process of processHandlers) {
          const documentType = getProcessDocumentMetadata(process);
          await DocumentStore.createResources(documentType, connection);
        }
      }

      if (sagaHandlers) {
        for (const saga of sagaHandlers) {
          await DocumentStore.createResources(saga, connection);
        }
      }

      await connection.query('COMMIT');
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }

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
          document: documentProjectionHandlers,
          event: eventProjectionHandlers,
        })
        .then();
    }
  }
}
