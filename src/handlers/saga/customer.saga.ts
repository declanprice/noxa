import * as dayjs from 'dayjs';

import { RabbitmqEventConsumerType, SagaLifeCycle } from '../../../lib';

import {
  ChangeCustomerAge,
  ChangeCustomerName,
  CustomerAgeChanged,
  CustomerNameChanged,
  CustomerRegistered,
  FailToChangeCustomerAge,
  FailToChangeCustomerName,
} from '../../model/streams/customer.stream';

import {
  Saga,
  StartSagaHandler,
} from '../../../lib/handlers/saga/saga.decorators';

import { SagaBuilder } from '../../../lib/handlers/saga/saga-life-cycle';

@Saga({ consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER })
export class CustomerSaga extends SagaLifeCycle {
  @StartSagaHandler({
    startOn: {
      event: CustomerRegistered,
      associationId: (e) => e.customerId,
    },
    listenFor: [
      CustomerRegistered,
      CustomerNameChanged,
      CustomerAgeChanged,
      FailToChangeCustomerName,
      FailToChangeCustomerAge,
    ],
  })
  start(event: CustomerRegistered) {
    const { customerId } = event;

    const saga = new SagaBuilder();

    saga
      .step('ChangeCustomerName-1')
      .thenPublishCommand(new ChangeCustomerName(customerId, 'sam'))
      .andExpectEvent(CustomerNameChanged);

    saga
      .step('ChangeCustomerAge-1')
      .thenPublishCommand(new ChangeCustomerAge(customerId, 33))
      .andExpectEvent(CustomerAgeChanged);

    saga
      .step('ChangeCustomerAge-2')
      .thenPublishCommand(new ChangeCustomerAge(customerId, 100))
      .andExpectEvent(CustomerAgeChanged);

    saga.failOnEvents([FailToChangeCustomerName, FailToChangeCustomerAge]);

    saga.failOnTimeout(dayjs().add(1, 'hour').toDate());

    return saga;
  }
}
