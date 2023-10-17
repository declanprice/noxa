import { HandleCommand, StoreSession } from '../lib';
import { RegisterCustomer } from './customer.stream';
export declare class RegisterCustomerHandler implements HandleCommand<RegisterCustomer> {
    private session;
    constructor(session: StoreSession);
    handle(command: RegisterCustomer): Promise<void>;
}
