import { DataProjection, ProjectionEventHandler } from '../../../lib';
import { Payment, paymentsTable } from '../../schema';
import { PaymentCapturedEvent } from '../api/events/payment-captured.event';
import { PaymentRefundedEvent } from '../api/events/payment-refunded.event';

@DataProjection(paymentsTable)
export class PaymentsProjection {
    @ProjectionEventHandler(PaymentCapturedEvent, (e) => e.paymentId)
    onRegistered(event: PaymentCapturedEvent): Payment {
        return {
            id: event.paymentId,
            amount: event.amount,
            orderId: event.orderId,
            refunded: false,
        };
    }

    @ProjectionEventHandler(PaymentRefundedEvent, (e) => e.paymentId)
    onRefunded(event: PaymentRefundedEvent, existing: Payment): Payment {
        return {
            ...existing,
            refunded: true,
        };
    }
}
