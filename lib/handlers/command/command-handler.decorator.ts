import { Command } from './command.type';

export const COMMAND_HANDLER_METADATA = 'COMMAND_HANDLER_METADATA';

export const CommandHandler = (
  command: Command | (new (...args: any[]) => Command),
): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(COMMAND_HANDLER_METADATA, command, target);
  };
};
