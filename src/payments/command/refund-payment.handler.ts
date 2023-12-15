import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { PaymentStream } from './payment.stream';
import { RefundPaymentCommand } from '../api/commands/refund-payment.command';
import { PaymentRefundedEvent } from '../api/events/payment-refunded.event';

@CommandHandler(RefundPaymentCommand)
export class CapturePaymentHandler extends HandleCommand {
    async handle(command: RefundPaymentCommand, session: DatabaseSession) {
        await session.eventStore.startStream(
            PaymentStream,
            command.paymentId,
            new PaymentRefundedEvent(command.paymentId),
        );
    }
}
