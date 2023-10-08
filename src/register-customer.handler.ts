import { Command, CommandHandler, HandleCommand } from '../lib';
import { MultiStoreSession } from '../lib/store';

export class RegisterCustomer implements Command {
  customerId: string;
  name: string;

  constructor(customerId: string, name: string) {
    this.customerId = customerId;
    this.name = name;
  }
}

@CommandHandler(RegisterCustomer)
export class RegisterCustomerHandler
  implements HandleCommand<RegisterCustomer>
{
  constructor(private readonly session: MultiStoreSession) {}

  async handle(command: RegisterCustomer) {
    const stores = await this.session.start();

    await stores.document.store();

    await stores.commit();
  }
}
