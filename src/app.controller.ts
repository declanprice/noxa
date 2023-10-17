import { Controller, Get } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { CommandBus } from '../lib';
import { RegisterCustomer } from './streams/customer.stream';

@Controller()
export class AppController {
  constructor(public commandBus: CommandBus) {}

  @Get('/')
  async get() {
    const customerId = randomUUID();

    await this.commandBus.invoke(new RegisterCustomer(customerId, 'declan'));
  }
}
