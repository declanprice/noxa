import { DynamicModule, Module, OnApplicationBootstrap } from '@nestjs/common';

import { HandlerExplorer } from './handlers';
import { BusImplementation, CommandBus } from './bus';
import { NOXA_BUS_TOKEN, NOXA_CONFIG_TOKEN } from './tokens/';
import { Outbox } from './bus/services/outbox.service';
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

@Module({
  exports: [CommandBus, QueryBus, EventBus, Outbox],
  providers: [CommandBus, QueryBus, EventBus, Outbox, HandlerExplorer],
})
export class NoxaModule implements OnApplicationBootstrap {
  constructor(
    private readonly handlerExplorer: HandlerExplorer,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
  ) {}

  public static forRoot(options: NoxaModuleOptions): DynamicModule {
    return {
      module: NoxaModule,
      providers: [
        {
          provide: NOXA_BUS_TOKEN,
          useValue: options.bus,
        },
        {
          provide: NOXA_CONFIG_TOKEN,
          useValue: {
            context: options.context,
            asyncDaemon: options.asyncDaemon,
          } as NoxaConfig,
        },
      ],
      global: true,
    };
  }

  async onApplicationBootstrap(): Promise<void> {
    const { commandHandlers, queryHandlers, eventHandlers } =
      this.handlerExplorer.explore();

    await this.commandBus.register(commandHandlers);
    await this.queryBus.register(queryHandlers);
    await this.eventBus.register(eventHandlers);
  }
}
