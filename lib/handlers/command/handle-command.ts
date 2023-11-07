import { Command } from './command.type';

import { DatabaseSession } from '../../store';

export abstract class HandleCommand {
    abstract handle(command: Command, session: DatabaseSession): Promise<any>;
}
