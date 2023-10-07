import { Command } from './command.type';
import { COMMAND_HANDLER_METADATA, COMMAND_METADATA } from '../constants';
import { v4 } from 'uuid';

export const CommandHandler = (
  command: Command | (new (...args: any[]) => Command),
): ClassDecorator => {
  return (target: object) => {
    if (!Reflect.hasOwnMetadata(COMMAND_METADATA, command)) {
      Reflect.defineMetadata(
        COMMAND_METADATA,
        { id: v4(), type: (command as any).name },
        command,
      );
    }
    Reflect.defineMetadata(COMMAND_HANDLER_METADATA, command, target);
  };
};
