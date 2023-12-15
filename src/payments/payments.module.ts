import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { CapturePaymentHandler } from './command/capture-payment.handler';
import { GetPaymentByIdHandler } from './query/get-payment-by-id.handler';
import { PaymentsProjection } from './query/payments.projection';

@Module({
    imports: [CapturePaymentHandler, GetPaymentByIdHandler, PaymentsProjection],
    controllers: [PaymentsController],
    providers: [],
})
export class PaymentsModule {}
