import { Command, HandleCommand } from '../lib';
import { StoreSession } from '../lib/store';
export declare class RegisterCustomer implements Command {
    customerId: string;
    name: string;
    constructor(customerId: string, name: string);
}
export declare class RegisterCustomerHandler implements HandleCommand<RegisterCustomer> {
    private readonly storeSession;
    constructor(storeSession: StoreSession);
    handle(command: RegisterCustomer): Promise<void>;
}
