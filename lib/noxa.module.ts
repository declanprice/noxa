import { DynamicModule, Module, OnApplicationBootstrap } from '@nestjs/common';

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

@Module({
  exports: [CommandBus],
  providers: [CommandBus, HandlerExplorer],
})
export class NoxaModule implements OnApplicationBootstrap {
  constructor(
    private readonly handlerExplorer: HandlerExplorer,
    private readonly commandBus: CommandBus,
  ) {}

  public static forRoot(options: NoxaModuleOptions): DynamicModule {
    return {
      module: NoxaModule,
      providers: [
        {
          provide: 'NOXA_BUS_IMPL',
          useValue: options.bus,
        },
      ],
      global: true,
    };
  }

  onApplicationBootstrap(): any {
    const { commandHandlers } = this.handlerExplorer.explore();

    this.commandBus.register(commandHandlers);
  }
}
