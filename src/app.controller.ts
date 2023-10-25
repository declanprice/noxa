import { Controller, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CommandBus, QueryBus } from '../lib';
import {
  ChangeCustomerName,
  RegisterCustomer,
} from './model/streams/customer.stream';

@Controller()
export class AppController {
  constructor(
    public commandBus: CommandBus,
    public queryBus: QueryBus,
  ) {}

  @Post('/')
  async get() {
    const customerId = randomUUID();

    const command = new RegisterCustomer(customerId, 'declan', 25);

    await this.commandBus.invoke(command);
  }

  @Post('/name')
  async updateName() {
    const command = new ChangeCustomerName('', 'bob');

    await this.commandBus.invoke(command);
  }
}
