import {
  Process,
  ProcessEventHandler,
  ProcessField,
  ProcessLifeCycle,
  RabbitmqEventConsumerType,
  Event,
} from '../../../lib';

import {
  CustomerNameChanged,
  CustomerRegistered,
} from '../../model/streams/customer.stream';
import * as dayjs from 'dayjs';

class CustomerProcessDeadlineEvent implements Event {
  constructor(public readonly customerId: string) {}
}

@Process({
  consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
})
export class CustomerProcess extends ProcessLifeCycle {
  @ProcessField()
  customerId?: string;

  @ProcessField()
  name?: string;

  @ProcessField()
  deadlineId?: string;

  @ProcessEventHandler({
    event: CustomerRegistered,
    associationId: (event) => event.customerId,
    start: true,
  })
  async onRegister(event: CustomerRegistered) {
    console.log('onRegister', event);

    this.customerId = event.customerId;
    this.name = event.name;
    this.deadlineId = await this.session.outbox.publishEvent(
      new CustomerProcessDeadlineEvent(event.customerId),
      { timestamp: dayjs().add(60, 'seconds').toISOString() },
    );
  }

  @ProcessEventHandler({
    event: CustomerNameChanged,
    associationId: (event) => event.customerId,
  })
  async onNameChange(event: CustomerRegistered) {
    console.log('onNameChangeEvent', event);

    this.name = event.name;

    if (this.deadlineId) {
      await this.session.outbox.unpublishEvent(this.deadlineId);
      this.deadlineId = undefined;
    }
  }

  @ProcessEventHandler({
    event: CustomerProcessDeadlineEvent,
    associationId: (e) => e.customerId,
  })
  onDeadline(event: CustomerProcessDeadlineEvent) {
    console.log('deadline event handler', event);

    this.end();
  }
}
