import { Controller, Get, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { and, CommandBus, DocumentStore, eq, QueryBus } from '../lib';
import {
    ChangeCustomerName,
    RegisterCustomer,
} from './model/streams/customer.stream';
import { faker } from '@faker-js/faker';
import { CustomerDocument } from './model/documents/customer.document';
@Controller()
export class AppController {
    constructor(
        public commandBus: CommandBus,
        public queryBus: QueryBus,
        public documentStore: DocumentStore,
    ) {}

    @Get('/')
    async get() {
        return this.documentStore
            .query(CustomerDocument)
            .condition(eq('name', 'tim'))
            .or()
            .condition(eq('name', 'declan'), and(), eq('age', 25))
            .from(0)
            .size(10)
            .debug()
            .execute();
    }

    @Post('/')
    async create() {
        const customerId = randomUUID();

        const command = new RegisterCustomer(
            customerId,
            faker.person.firstName(),
            faker.number.int({ min: 10, max: 80 }),
        );

        await this.commandBus.invoke(command);
    }

    @Post('/name')
    async updateName() {
        const command = new ChangeCustomerName('', 'bob');

        await this.commandBus.invoke(command);
    }
}
