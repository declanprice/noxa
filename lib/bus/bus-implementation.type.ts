import { Type } from '@nestjs/common';

import {
  Command,
  HandleCommand,
  HandleEvent,
  Process,
  Saga,
} from '../handlers';

export type BusImplementation = {
  sendCommand(command: Command): Promise<void>;
  registerCommandHandlers(handlers: HandleCommand<Command>[]): Promise<void>;

  sendEvent(command: Command): Promise<void>;
  registerEventHandlers(handlers: HandleEvent<Event>[]): Promise<void>;

  registerSagas(sagas: Type<Saga>[]): Promise<void>;

  registerProcesses(processes: Type<Process>[]): Promise<void>;
};
