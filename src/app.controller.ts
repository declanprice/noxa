import { Controller, Get, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CommandBus, QueryBus } from '../lib';
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
            faker.person.lastName(),
            faker.date.birthdate().toDateString(),
            ['snowboarding', 'climbing', 'software development'],
        );

        return await this.commandBus.invoke(command);
    }

    @Post('/name')
    async updateName() {
        const command = new ChangeCustomerName(
            'b1b5f9e6-fe03-4ad7-9dd8-df622989b28e',
            'Deshaun',
            'Been Changed',
        );

        return await this.commandBus.invoke(command);
    }
}
