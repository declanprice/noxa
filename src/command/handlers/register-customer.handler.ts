import {
    CustomerRegistered,
    CustomerStream,
    RegisterCustomer,
} from '../customer.stream';
import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';

@CommandHandler(RegisterCustomer)
export class RegisterCustomerHandler extends HandleCommand {
    async handle(command: RegisterCustomer, session: DatabaseSession) {
        const event = new CustomerRegistered(
            command.customerId,
            command.firstName,
            command.lastName,
            command.dateOfBirth,
            command.hobbies,
        );

        await session.event.startStream(
            CustomerStream,
            command.customerId,
            event,
        );

        await session.outbox.publishEvent(event);
    }
}
