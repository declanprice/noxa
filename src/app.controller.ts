import { Controller, Get } from '@nestjs/common';
import { CommandBus } from '../lib';
import { ChangeCustomerName, RegisterCustomer } from './customer.stream';
import { randomUUID } from 'crypto';

@Controller()
export class AppController {
  constructor(public commandBus: CommandBus) {}

  @Get('/')
  async get() {
    const customerId = randomUUID();
    await this.commandBus.invoke(new RegisterCustomer(customerId, 'declan'));
    await this.commandBus.invoke(new ChangeCustomerName(customerId, 'tony'));
  }
}
