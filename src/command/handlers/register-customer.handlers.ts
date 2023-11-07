import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';
import {
    CustomerRegistered,
    CustomerStream,
    RegisterCustomer,
} from '../customer.stream';
import { CommandHandler, HandleCommand } from '../../../lib';
import { customers } from '../../schema';

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

        await this.session.data.store(customers, {
            id: randomUUID(),
            hobbies: ['asdasd'],
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            dateOfBirth: faker.date.birthdate(),
        });

        await this.session.outbox.publishEvent(event);
    }
}
