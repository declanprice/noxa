import { Command } from './command.type';
import { BusMessage } from '../../bus';
export type HandleCommand<TCommand extends Command = any, TResult = any> = {
    handle(command: TCommand, busMessage?: BusMessage): Promise<TResult>;
};
