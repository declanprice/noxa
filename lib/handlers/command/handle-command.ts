import { CommandMessage } from './command.type';

export abstract class HandleCommand {
    abstract handle(command: CommandMessage<any>): Promise<any>;
}
