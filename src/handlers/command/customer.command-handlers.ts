import {
    ChangeCustomerAge,
    ChangeCustomerName,
    CustomerAgeChanged,
    CustomerNameChanged,
    CustomerRegistered,
    CustomerStream,
    RegisterCustomer,
} from '../../model/streams/customer.stream';

import { CommandHandler, HandleCommand } from '../../../lib';
import { CustomerDocument } from '../../model/documents/customer.document';
import { randomUUID } from 'crypto';

@CommandHandler(RegisterCustomer)
export class RegisterCustomerHandler extends HandleCommand {
    async handle(command: RegisterCustomer) {
        const event = new CustomerRegistered(
            command.customerId,
            command.name,
            command.age,
        );

        await this.session.event.startStream(
            CustomerStream,
            command.customerId,
            event,
        );

        // await this.session.outbox.publishEvent(event);
    }
}

@CommandHandler(ChangeCustomerName)
export class ChangeCustomerNameHandler extends HandleCommand {
    async handle(command: ChangeCustomerName) {
        const event = new CustomerNameChanged(command.customerId, command.name);

        await this.session.event.appendEvent(
            CustomerStream,
            command.customerId,
            event,
        );

        await this.session.outbox.publishEvent(event);
    }
}

@CommandHandler(ChangeCustomerAge)
export class ChangeCustomerAgeCommandHandler extends HandleCommand {
    async handle(command: ChangeCustomerAge) {
        const event = new CustomerAgeChanged(command.customerId, command.age);

        await this.session.event.appendEvent(
            CustomerStream,
            command.customerId,
            event,
        );

        await this.session.outbox.publishEvent(event);
    }
}
