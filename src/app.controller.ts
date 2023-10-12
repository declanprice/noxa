import { Controller, Get } from '@nestjs/common';
import { CommandBus } from '../lib';
import { RegisterCustomer } from './register-customer.handler';
import { randomUUID } from 'crypto';

@Controller()
export class AppController {
  constructor(public commandBus: CommandBus) {}

  @Get('/')
  async get() {
    await this.commandBus.invoke(
      new RegisterCustomer('efac5b66-6744-41a9-8ad4-ffef4228a15b', 'declan'),
    );
  }
}
