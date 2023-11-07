import { Command, Event, Stream, StreamEventHandler } from '../../lib';

export class RegisterCustomer implements Command {
    constructor(
        public customerId: string,
        public firstName: string,
        public lastName: string,
        public dateOfBirth: string,
        public hobbies: string[],
    ) {}
}

export class ChangeCustomerName implements Command {
    constructor(
        public customerId: string,
        public firstName: string,
        public lastName: string,
    ) {}
}

export class CustomerRegistered implements Event {
    constructor(
        public customerId: string,
        public firstName: string,
        public lastName: string,
        public dateOfBirth: string,
        public hobbies: string[],
    ) {}
}

export class CustomerNameChanged implements Event {
    constructor(
        public customerId: string,
        public firstName: string,
        public lastName: string,
    ) {}
}

@Stream({
    snapshotPeriod: 10,
})
export class CustomerStream {
    customerId!: string;
    firstName!: string;
    lastName!: string;
    dateOfBirth!: string;
    hobbies!: string[];

    @StreamEventHandler(CustomerRegistered)
    onCustomerRegistered(event: CustomerRegistered) {
        this.customerId = event.customerId;
        this.firstName = event.firstName;
        this.lastName = event.lastName;
        this.dateOfBirth = event.dateOfBirth;
        this.hobbies = event.hobbies;
    }

    @StreamEventHandler(CustomerNameChanged)
    onCustomerNameChanged(event: CustomerNameChanged) {
        this.firstName = event.firstName;
        this.lastName = event.lastName;
    }
}
