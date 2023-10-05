import { Command, CommandHandler, HandleCommand } from '../lib';

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
  async handle(command: RegisterCustomer) {
    console.log('command was executed', command);
  }
}
