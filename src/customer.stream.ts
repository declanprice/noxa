import { Command, Event, EventStream, EventStreamHandler } from '../lib';

export class RegisterCustomer implements Command {
  customerId: string;
  name: string;

  constructor(customerId: string, name: string) {
    this.customerId = customerId;
    this.name = name;
  }
}

export class ChangeCustomerName implements Command {
  customerId: string;
  name: string;

  constructor(customerId: string, name: string) {
    this.customerId = customerId;
    this.name = name;
  }
}

export class CustomerRegistered implements Event {
  customerId: string;
  name: string;

  constructor(customerId: string, name: string) {
    this.customerId = customerId;
    this.name = name;
  }
}

export class CustomerNameChanged implements Event {
  customerId: string;
  name: string;

  constructor(customerId: string, name: string) {
    this.customerId = customerId;
    this.name = name;
  }
}

@EventStream({
  snapshotPeriod: 10,
})
export class CustomerStream {
  customerId?: string;
  name?: string;

  @EventStreamHandler(CustomerRegistered)
  onCustomerRegistered(event: CustomerRegistered) {
    console.log('event handler called with event', event);
    this.customerId = event.customerId;
    this.name = event.name;
  }

  @EventStreamHandler(CustomerNameChanged)
  onCustomerNameChanged(event: CustomerNameChanged) {
    this.name = event.name;
  }
}
