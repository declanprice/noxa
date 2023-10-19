import { Command, Event, Stream, StreamEventHandler } from '../../../lib';

export class RegisterCustomer implements Command {
  constructor(
    public customerId: string,
    public name: string,
    public age: number,
  ) {}
}

export class ChangeCustomerName implements Command {
  constructor(
    public customerId: string,
    public name: string,
  ) {}
}

export class ChangeCustomerAge implements Command {
  constructor(
    public customerId: string,
    public age: number,
  ) {}
}

export class CustomerRegistered implements Event {
  constructor(
    public customerId: string,
    public name: string,
    public age: number,
  ) {}
}

export class CustomerNameChanged implements Event {
  constructor(
    public customerId: string,
    public name: string,
  ) {}
}

export class CustomerAgeChanged implements Event {
  constructor(
    public customerId: string,
    public age: number,
  ) {}
}

export class FailToChangeCustomerName implements Event {
  constructor(public customerId: string) {}
}

export class FailToChangeCustomerAge implements Event {
  constructor(public customerId: string) {}
}

@Stream({
  snapshotPeriod: 10,
})
export class CustomerStream {
  customerId?: string;
  name?: string;
  age?: number;

  @StreamEventHandler(CustomerRegistered)
  onCustomerRegistered(event: CustomerRegistered) {
    console.log('event handler called with event', event);
    this.customerId = event.customerId;
    this.name = event.name;
    this.age = event.age;
  }

  @StreamEventHandler(CustomerNameChanged)
  onCustomerNameChanged(event: CustomerNameChanged) {
    this.name = event.name;
  }

  @StreamEventHandler(CustomerAgeChanged)
  onAgeChange(event: CustomerAgeChanged) {
    this.age = event.age;
  }
}
