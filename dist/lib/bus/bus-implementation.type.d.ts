import { Command, HandleCommand, HandleEvent } from '../handlers';
import { BusMessage } from './bus-message.type';
export type BusImplementation = {
    init(): Promise<void>;
    sendCommand(command: BusMessage): Promise<void>;
    sendEvent(event: BusMessage): Promise<void>;
    registerCommandHandler(handler: HandleCommand<Command>): Promise<void>;
    registerEventHandler(handler: HandleEvent<Event>): Promise<void>;
};
