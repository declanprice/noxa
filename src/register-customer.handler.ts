import {
  Command,
  Event,
  EventStream,
  EventStreamHandler,
  CommandHandler,
  HandleCommand,
  StoreSession,
  Document,
  DocumentId,
} from '../lib';
import { randomUUID } from 'crypto';

export class RegisterCustomer implements Command {
  customerId: string;
  name: string;

  constructor(customerId: string, name: string) {
    this.customerId = customerId;
    this.name = name;
  }
}

export class CustomerRegisteredEvent implements Event {
  customerId: string;
  name: string;

  constructor(customerId: string, name: string) {
    this.customerId = customerId;
    this.name = name;
  }
}

export class CustomerNameChangedEvent implements Event {
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

  @EventStreamHandler(CustomerRegisteredEvent)
  onCustomerRegistered(event: CustomerRegisteredEvent) {
    console.log('event handler called with event', event);
    this.customerId = event.customerId;
    this.name = event.name;
  }

  @EventStreamHandler(CustomerNameChangedEvent)
  onCustomerNameChanged(event: CustomerNameChangedEvent) {
    this.name = event.name;
  }
}

@Document()
export class CustomerDocument {
  @DocumentId()
  customerId!: string;

  name!: string;

  constructor(customerId: string, name: string) {
    this.customerId = customerId;
    this.name = name;
  }
}

@CommandHandler(RegisterCustomer)
export class RegisterCustomerHandler
  implements HandleCommand<RegisterCustomer>
{
  constructor(private session: StoreSession) {}

  async handle(command: RegisterCustomer) {
    const session = await this.session.start();

    // const event = new CustomerNameChangedEvent(
    //   command.customerId,
    //   command.name,
    // );
    //
    // await session.event.appendEvent(CustomerStream, command.customerId, event);
    //
    // await session.outbox.publishEvent(event);

    // const customer = await session.event.hydrateStream(
    //   CustomerStream,
    //   'efac5b66-6744-41a9-8ad4-ffef4228a15b',
    // );

    // await session.event.startStream(
    //   CustomerStream,
    //   command.customerId,
    //   new CustomerRegisteredEvent(command.customerId, command.name),
    // );

    await session.commit();
  }
}
