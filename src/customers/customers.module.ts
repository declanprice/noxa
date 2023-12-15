import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { RegisterCustomerHandler } from './command/register-customer.handler';
import { GetCustomerByIdHandler } from './query/get-customer-by-id.handler';
import { CustomersProjection } from './query/customers.projection';

@Module({
  imports: [
    RegisterCustomerHandler,
    GetCustomerByIdHandler,
    CustomersProjection,
  ],
  controllers: [CustomersController],
  providers: [],
})
export class CustomersModule {}
