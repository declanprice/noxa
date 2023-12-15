import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '../../lib';
import { GetCustomerById } from './api/queries/get-customer-by-id.query';
import { RegisterCustomer } from './api/commands/register-customer.command';

@Controller('/customers')
export class CustomersController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    register(@Body() dto: RegisterCustomer) {
        return this.commandBus.invoke(
            new RegisterCustomer(
                dto.customerId,
                dto.firstName,
                dto.lastName,
                dto.email,
            ),
        );
    }

    @Get('/:id')
    getById(@Param('id') id: string) {
        return this.queryBus.invoke(new GetCustomerById(id));
    }
}
