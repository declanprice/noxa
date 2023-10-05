import { Command, HandleCommand } from '../handlers';
export type Bus = {
    sendCommand(command: Command): Promise<void>;
    registerCommandHandlers(handlers: HandleCommand<Command>[]): Promise<void>;
};
