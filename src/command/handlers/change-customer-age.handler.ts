import {
    ChangeCustomerAge,
    ChangeCustomerName,
    CustomerAgeChanged,
    CustomerNameChanged,
    CustomerRegistered,
    CustomerStream,
    RegisterCustomer,
} from '../customer.stream';

import { CommandHandler, DataStore, HandleCommand } from '../../../lib';
import { customers } from '../../schema';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';

@CommandHandler(ChangeCustomerAge)
export class ChangeCustomerAgeCommandHandler extends HandleCommand {
    async handle(command: ChangeCustomerAge) {
        const event = new CustomerAgeChanged(command.customerId, command.age);

        // await this.session.event.appendEvent(
        //     CustomerStream,
        //     command.customerId,
        //     event,
        // );
        //
        // await this.session.outbox.publishEvent(event);
    }
}
