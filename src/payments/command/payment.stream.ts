import { Stream, StreamEventHandler } from '../../../lib';
import { PaymentCapturedEvent } from '../api/events/payment-captured.event';
import { PaymentRefundedEvent } from '../api/events/payment-refunded.event';
import { PaymentCreatedEvent } from '../api/events/payment-created.event';

@Stream()
export class PaymentStream {
    paymentId: string;
    orderId: string;
    amount: number;
    captured: boolean;
    refunded: boolean;

    @StreamEventHandler(PaymentCreatedEvent)
    onCreated(event: PaymentCreatedEvent) {
        this.paymentId = event.paymentId;
        this.orderId = event.orderId;
        this.amount = event.amount;
        this.refunded = false;
        this.captured = false;
    }

    @StreamEventHandler(PaymentCapturedEvent)
    onRegistered(event: PaymentCapturedEvent) {
        this.captured = true;
    }

    @StreamEventHandler(PaymentRefundedEvent)
    onRefunded(event: PaymentRefundedEvent) {
        this.refunded = true;
    }
}
