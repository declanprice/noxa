import { Controller, Post } from '@nestjs/common';
import { CommandBus } from '../lib';

@Controller('/')
export class AppController {

    constructor(private readonly commandBus: CommandBus) {}

    @Post('test-command')
    async testCommand() {
        return this.commandBus.invoke('test-command', {name: 'declan'})
    }
}