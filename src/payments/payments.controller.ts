import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '../../lib';

@Controller('/payments')
export class PaymentsController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    register(@Body() dto: any) {}

    @Get('/:id')
    getById(@Param('id') id: string) {}
}
