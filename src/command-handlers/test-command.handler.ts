import { CommandHandler, HandleCommand, OutboxStore } from '../../lib';
import { CommandMessage } from '../../lib/handlers/command/command.type';

@CommandHandler('test-command')
export class TestCommandHandler implements HandleCommand {

    constructor(private readonly outbox: OutboxStore) {}

    async handle(command: CommandMessage<any>) {
        return this.outbox.command('test-command', {name: 'declan'});
    }
}