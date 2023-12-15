import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { RegisterCustomer } from '../api/commands/register-customer.command';
import { CustomerStream } from './customer.stream';
import { CustomerRegistered } from '../api/events/customer-registered.event';

@CommandHandler(RegisterCustomer)
export class RegisterCustomerHandler extends HandleCommand {
    async handle(command: RegisterCustomer, session: DatabaseSession) {
        await session.eventStore.startStream(
            CustomerStream,
            command.customerId,
            new CustomerRegistered(
                command.customerId,
                command.firstName,
                command.lastName,
                command.email,
            ),
        );
    }
}
