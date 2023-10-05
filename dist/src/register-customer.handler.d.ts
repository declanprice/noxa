import { Command, HandleCommand } from '../lib';
export declare class RegisterCustomer implements Command {
    customerId: string;
    name: string;
    constructor(customerId: string, name: string);
}
export declare class RegisterCustomerHandler implements HandleCommand<RegisterCustomer> {
    handle(command: RegisterCustomer): Promise<void>;
}
