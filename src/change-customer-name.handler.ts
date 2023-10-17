import { CommandHandler, HandleCommand, StoreSession } from '../lib';
import {
  ChangeCustomerName,
  CustomerNameChanged,
  CustomerStream,
} from './customer.stream';

@CommandHandler(ChangeCustomerName)
export class ChangeCustomerNameHandler
  implements HandleCommand<ChangeCustomerName>
{
  constructor(private session: StoreSession) {}

  async handle(command: ChangeCustomerName) {
    const session = await this.session.start();

    await session.event.appendEvent(
      CustomerStream,
      command.customerId,
      new CustomerNameChanged(command.customerId, command.name),
    );

    await session.commit();
  }
}
