import { Command, Event, HandleCommand, StoreSession } from '../lib';
export declare class RegisterCustomer implements Command {
    customerId: string;
    name: string;
    constructor(customerId: string, name: string);
}
export declare class CustomerRegisteredEvent implements Event {
    customerId: string;
    name: string;
    constructor(customerId: string, name: string);
}
export declare class CustomerNameChangedEvent implements Event {
    customerId: string;
    name: string;
    constructor(customerId: string, name: string);
}
export declare class CustomerStream {
    customerId?: string;
    name?: string;
    onCustomerRegistered(event: CustomerRegisteredEvent): void;
    onCustomerNameChanged(event: CustomerNameChangedEvent): void;
}
export declare class CustomerDocument {
    customerId: string;
    name: string;
    constructor(customerId: string, name: string);
}
export declare class RegisterCustomerHandler implements HandleCommand<RegisterCustomer> {
    private session;
    constructor(session: StoreSession);
    handle(command: RegisterCustomer): Promise<void>;
}
