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

  @Post('/')
  async get() {
    const customerId = randomUUID();

    const command = new RegisterCustomer(customerId, 'declan');

    await this.commandBus.invoke(command);
  }

  @Post('/name')
  async updateName() {
    const command = new ChangeCustomerName(
      '2088d4b2-5d48-4d9b-ad34-1c44b830a2be',
      'bob',
    );

    await this.commandBus.invoke(command);
  }
}
