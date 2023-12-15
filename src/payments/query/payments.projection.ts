import { DataProjection, ProjectionEventHandler } from '../../../lib';
import { Payment, payments } from '../../schema';
import { PaymentCapturedEvent } from '../api/events/payment-captured.event';
import { PaymentRefundedEvent } from '../api/events/payment-refunded.event';

@DataProjection(payments)
export class PaymentsProjection {
    @ProjectionEventHandler(PaymentCapturedEvent, (e) => e.id)
    onRegistered(event: PaymentCapturedEvent): Payment {
        return {
            id: event.id,
            dateIssued: event.dateIssued,
            amount: event.amount,
            customerId: event.customerId,
            orderId: event.orderId,
            shipmentId: event.shipmentId,
            refunded: false,
        };
    }

    @ProjectionEventHandler(PaymentRefundedEvent, (e) => e.id)
    onRefunded(event: PaymentRefundedEvent, existing: Payment): Payment {
        return {
            ...existing,
            refunded: true,
        };
    }
}
