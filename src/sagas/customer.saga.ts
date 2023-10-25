import * as dayjs from 'dayjs';

import {
  RabbitmqEventConsumerType,
  SagaLifeCycle,
  SagaBuilder,
  Saga,
  StartSagaHandler,
} from '../../lib';

import {
  ChangeCustomerAge,
  ChangeCustomerName,
  CustomerAgeChanged,
  CustomerNameChanged,
  CustomerRegistered,
} from '../model/streams/customer.stream';

@Saga({ consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER })
export class CustomerSaga extends SagaLifeCycle {
  @StartSagaHandler({
    startOn: {
      event: CustomerRegistered,
      associationId: (e) => e.customerId,
    },
    listenFor: [CustomerRegistered, CustomerNameChanged, CustomerAgeChanged],
  })
  start(event: CustomerRegistered) {
    const { customerId } = event;

    const saga = new SagaBuilder();

    saga
      .step('ChangeCustomerName-1')
      .thenPublishCommand(new ChangeCustomerName(customerId, 'sam'))
      .withCompensationCommand(
        new ChangeCustomerName(customerId, 'changed via compensation 1'),
      )
      .andExpectEvent(CustomerNameChanged);

    saga
      .step('ChangeCustomerAge-1')
      .thenPublishCommand(new ChangeCustomerAge(customerId, 33))
      .withCompensationCommand(
        new ChangeCustomerName(customerId, 'changed via compensation 2'),
      )
      .andExpectEvent(CustomerAgeChanged);

    saga
      .step('ChangeCustomerAge-2')
      .thenPublishCommand(new ChangeCustomerAge(customerId, 100))
      .andExpectEvent(CustomerAgeChanged);

    saga.failOnTimeout(dayjs().add(1, 'hour').toDate());

    return saga;
  }
}
