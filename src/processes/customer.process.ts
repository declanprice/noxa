import {
  Process,
  ProcessEventHandler,
  HandleProcess,
  RabbitmqEventConsumerType,
  Event,
} from '../../lib';

import {
  CustomerNameChanged,
  CustomerRegistered,
} from '../model/streams/customer.stream';

import * as dayjs from 'dayjs';

import { CustomerProcessDocument } from '../model/documents/customer-process.document';

class CustomerProcessDeadlineEvent implements Event {
  constructor(public readonly customerId: string) {}
}

@Process(CustomerProcess, {
  consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
})
export class CustomerProcess extends HandleProcess {
  @ProcessEventHandler({
    event: CustomerRegistered,
    associationId: (event) => event.customerId,
    start: true,
  })
  async onRegister(
    event: CustomerRegistered,
    process: CustomerProcessDocument,
  ) {
    console.log('onRegister', event);

    const in60Seconds = dayjs().add(60, 'seconds').toISOString();
    process.associateWith('1');
    process.associateWith('2');
    process.customerId = event.customerId;
    process.age = event.age;
    process.name = event.name;
    process.deadlineId = await this.session.outbox.publishEvent(
      new CustomerProcessDeadlineEvent(event.customerId),
      { timestamp: in60Seconds },
    );

    return process;
  }

  @ProcessEventHandler({
    event: CustomerNameChanged,
    associationId: (event) => event.customerId,
  })
  async onNameChange(
    event: CustomerRegistered,
    process: CustomerProcessDocument,
  ) {
    console.log('onNameChangeEvent', event);

    process.name = event.name;

    if (process.deadlineId) {
      await this.session.outbox.unpublish(process.deadlineId);
      process.deadlineId = null;
    }

    return process;
  }

  @ProcessEventHandler({
    event: CustomerProcessDeadlineEvent,
    associationId: (e) => e.customerId,
  })
  onDeadline(
    event: CustomerProcessDeadlineEvent,
    process: CustomerProcessDocument,
  ) {
    console.log('deadline event handlers', event);

    process.end();

    return process;
  }
}
