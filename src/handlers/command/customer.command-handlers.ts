import {
  ChangeCustomerName,
  CustomerNameChanged,
  CustomerRegistered,
  CustomerStream,
  RegisterCustomer,
} from '../../streams/customer.stream';

import { CommandHandler, HandleCommand, StoreSession } from '../../../lib';

@CommandHandler(RegisterCustomer)
export class RegisterCustomerHandler
  implements HandleCommand<RegisterCustomer>
{
  constructor(private session: StoreSession) {}

  async handle(command: RegisterCustomer) {
    const session = await this.session.start();

    const event = new CustomerRegistered(command.customerId, command.name);

    await session.event.startStream(CustomerStream, command.customerId, event);

    await session.outbox.publishEvent(event);

    await session.commit();
  }
}

@CommandHandler(ChangeCustomerName)
export class ChangeCustomerNameHandler
  implements HandleCommand<ChangeCustomerName>
{
  constructor(private session: StoreSession) {}

  async handle(command: ChangeCustomerName) {
    const session = await this.session.start();

    const event = new CustomerNameChanged(command.customerId, command.name);

    await session.event.appendEvent(CustomerStream, command.customerId, event);

    await session.commit();
  }
}
