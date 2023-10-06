import { Command, HandleCommand, HandleEvent } from '../handlers';
import { BusMessage } from './bus-message.type';

export type BusImplementation = {
  sendCommand(command: BusMessage): Promise<void>;
  registerCommandHandler(handler: HandleCommand<Command>): Promise<void>;

  sendEvent(event: BusMessage): Promise<void>;
  registerEventHandler(handler: HandleEvent<Event>): Promise<void>;
};
