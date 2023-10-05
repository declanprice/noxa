import { Logger, Type } from '@nestjs/common';

import { BusImplementation } from '../bus-implementation.type';

import {
  Command,
  HandleCommand,
  HandleEvent,
  Process,
  Saga,
} from '../../handlers';

export class RabbitmqBus implements BusImplementation {
  private logger = new Logger(RabbitmqBus.name);

  constructor(connectionUrl: string) {}

  async sendCommand(command: Command): Promise<void> {
    this.logger.log('rabbitmq send command', command);
  }

  async registerCommandHandlers(
    handlers: HandleCommand<Command>[],
  ): Promise<void> {}

  async sendEvent(event: Event): Promise<void> {}
  async registerEventHandlers(handlers: HandleEvent<Event>[]): Promise<void> {}

  async registerSagas(sagas: Type<Saga>[]): Promise<void> {}

  async registerProcesses(processes: Type<Process>[]): Promise<void> {}
}
