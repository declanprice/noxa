import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { PaymentStream } from './payment.stream';
import { CapturePaymentCommand } from '../api/commands/capture-payment.command';
import { PaymentCapturedEvent } from '../api/events/payment-captured.event';

@CommandHandler(CapturePaymentCommand)
export class CapturePaymentHandler extends HandleCommand {
    async handle(command: CapturePaymentCommand, session: DatabaseSession) {
        const payment = await session.eventStore.hydrateStream(
            PaymentStream,
            command.paymentId,
        );

        if (payment.captured) {
            return console.log(
                `payment with id ${payment.paymentId} has already been captured`,
            );
        }

        const capturedEvent = new PaymentCapturedEvent(
            command.paymentId,
            payment.orderId,
            payment.amount,
        );

        await session.eventStore.startStream(
            PaymentStream,
            command.paymentId,
            capturedEvent,
        );

        await session.outboxStore.publishEvent(capturedEvent);
    }
}
