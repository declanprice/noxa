import {
  Process,
  ProcessEventHandler,
  ProcessField,
  ProcessLifeCycle,
  RabbitmqEventConsumerType,
} from '../../../lib';

import {
  CustomerNameChanged,
  CustomerRegistered,
} from '../../model/streams/customer.stream';

@Process({
  consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
})
export class CustomerProcess extends ProcessLifeCycle {
  @ProcessField()
  customerId?: string;

  @ProcessField()
  name?: string;

  @ProcessEventHandler({
    event: CustomerRegistered,
    associationId: (event) => event.customerId,
    start: true,
  })
  async onRegister(event: CustomerRegistered) {
    console.log('onRegister', event);
    this.customerId = event.customerId;
    this.name = event.name;
  }

  @ProcessEventHandler({
    event: CustomerNameChanged,
    associationId: (event) => event.customerId,
  })
  async onNameChange(event: CustomerRegistered) {
    console.log('onNameChangeEvent', event);

    this.name = event.name;

    if (event.name === 'bob') {
      await this.end();
    }
  }
}
