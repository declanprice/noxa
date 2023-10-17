import { CommandHandler, HandleCommand, StoreSession } from '../lib';
import {
  CustomerRegistered,
  CustomerStream,
  RegisterCustomer,
} from './customer.stream';

@CommandHandler(RegisterCustomer)
export class RegisterCustomerHandler
  implements HandleCommand<RegisterCustomer>
{
  constructor(private session: StoreSession) {}

  async handle(command: RegisterCustomer) {
    const session = await this.session.start();

    await session.event.startStream(
      CustomerStream,
      command.customerId,
      new CustomerRegistered(command.customerId, command.name),
    );

    await session.commit();
  }
}
