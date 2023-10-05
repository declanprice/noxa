import { Command } from './command.type';

export type HandleCommand<TCommand extends Command = any, TResult = any> = {
  handle(command: TCommand): Promise<TResult>;
};
