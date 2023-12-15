import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { PaymentStream } from './payment.stream';
import { PaymentCapturedEvent } from '../api/events/payment-captured.event';
import { CreatePaymentCommand } from '../api/commands/create-payment.command';

@CommandHandler(CreatePaymentCommand)
export class CapturePaymentHandler extends HandleCommand {
    async handle(command: CreatePaymentCommand, session: DatabaseSession) {
        await session.eventStore.startStream(
            PaymentStream,
            command.paymentId,
            new PaymentCapturedEvent(
                command.paymentId,
                command.orderId,
                command.amount,
            ),
        );
    }
}
