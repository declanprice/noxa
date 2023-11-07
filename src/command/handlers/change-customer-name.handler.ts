import {
    ChangeCustomerName,
    CustomerNameChanged,
    CustomerStream,
} from '../customer.stream';

import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';

@CommandHandler(ChangeCustomerName)
export class ChangeCustomerNameHandler extends HandleCommand {
    async handle(command: ChangeCustomerName, session: DatabaseSession) {
        const customer = await session.event.hydrateStream(
            CustomerStream,
            command.customerId,
        );

        if (
            customer.firstName === command.firstName &&
            customer.lastName === command.lastName
        ) {
            throw new Error(
                `name is already ${command.firstName} ${command.lastName}`,
            );
        }

        const event = new CustomerNameChanged(
            command.customerId,
            command.firstName,
            command.lastName,
        );

        await session.event.appendEvent(
            CustomerStream,
            command.customerId,
            event,
        );

        await session.outbox.publishEvent(event);
    }
}
