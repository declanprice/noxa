import { Command } from './command.type';
import { BusMessage } from '../../bus';
import { Session } from '../../store/session/store-session.service';

export abstract class HandleCommand {
    session!: Session;

    constructor() {}

    abstract handle(command: Command, busMessage?: BusMessage): Promise<any>;
}
