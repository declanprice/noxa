import { Controller, Get, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CommandBus, DataStore, QueryBus } from '../lib';
import {
    ChangeCustomerName,
    RegisterCustomer,
} from './command/customer.stream';
import { faker } from '@faker-js/faker';
import { GetCustomersQuery } from './query/handlers/get-customers.handler';

@Controller()
export class AppController {
    constructor(
        public commandBus: CommandBus,
        public queryBus: QueryBus,
    ) {}

    @Get('/')
    async get() {
        return await this.queryBus.invoke(new GetCustomersQuery());
    }

    @Post('/')
    async create() {
        const customerId = randomUUID();

        const command = new RegisterCustomer(
            customerId,
            faker.person.firstName(),
            faker.number.int({ min: 10, max: 80 }),
        );

        return await this.commandBus.invoke(command);
    }

    @Post('/name')
    async updateName() {
        const command = new ChangeCustomerName('', 'bob');

        return await this.commandBus.invoke(command);
    }
}
