import { Controller, Get, Logger } from '@nestjs/common';
import { CommandBus } from '../lib';
import { RegisterCustomer } from './register-customer.handler';

@Controller()
export class AppController {
  constructor(public commandBus: CommandBus) {}

  @Get('/')
  async get() {
    await this.commandBus.send(new RegisterCustomer('1', 'declan'));
  }
}
