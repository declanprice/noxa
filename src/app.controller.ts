import { Controller, Get, Param, Post, Put } from '@nestjs/common';
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

    @Post('/customers')
    async create() {
        const customerId = randomUUID();

        await this.commandBus.invoke(
            new RegisterCustomer(
                customerId,
                faker.person.firstName(),
                faker.person.lastName(),
                faker.date.birthdate().toDateString(),
                ['snowboarding', 'climbing', 'software development'],
            ),
        );

        return customerId;
    }

    @Put('/customers/:id/name')
    async updateName(@Param('id') id: string) {
        return await this.commandBus.invoke(
            new ChangeCustomerName(
                id,
                faker.person.firstName(),
                faker.person.lastName(),
            ),
        );
    }
}
