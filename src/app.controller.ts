import { Controller, Get, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { CommandBus } from '../lib';
import {
  ChangeCustomerName,
  RegisterCustomer,
} from './model/streams/customer.stream';

@Controller()
export class AppController {
  constructor(public commandBus: CommandBus) {}

  customerId = randomUUID();

  @Post('/')
  async get() {
    const command = new RegisterCustomer(this.customerId, 'declan');

    await this.commandBus.invoke(command);
  }

  @Post('/name')
  async updateName() {
    const command = new ChangeCustomerName(this.customerId, 'bob');

    await this.commandBus.invoke(command);
  }
}
