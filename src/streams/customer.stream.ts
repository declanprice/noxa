import { Command, Event, Stream, StreamEventHandler } from '../../lib';

export class RegisterCustomer implements Command {
  constructor(
    public customerId: string,
    public name: string,
  ) {}
}

export class ChangeCustomerName implements Command {
  constructor(
    public customerId: string,
    public name: string,
  ) {}
}

export class CustomerRegistered implements Event {
  constructor(
    public customerId: string,
    public name: string,
  ) {}
}

export class CustomerNameChanged implements Event {
  constructor(
    public customerId: string,
    public name: string,
  ) {}
}

@Stream({
  snapshotPeriod: 10,
})
export class CustomerStream {
  customerId?: string;
  name?: string;

  @StreamEventHandler(CustomerRegistered)
  onCustomerRegistered(event: CustomerRegistered) {
    console.log('event handler called with event', event);
    this.customerId = event.customerId;
    this.name = event.name;
  }

  @StreamEventHandler(CustomerNameChanged)
  onCustomerNameChanged(event: CustomerNameChanged) {
    this.name = event.name;
  }
}
