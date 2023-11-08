import {
    RabbitmqEventConsumerType,
    Saga,
    StartSagaHandler,
} from '../../../lib';

import {
    HandleSaga,
    SagaBuilder,
} from '../../../lib/handlers/saga/handle-saga';

import {
    ChangeCustomerName,
    CustomerNameChanged,
    CustomerRegistered,
} from '../../command/customer.stream';

@Saga({ consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER })
export class CustomerSaga extends HandleSaga {
    @StartSagaHandler({
        startOn: {
            event: CustomerRegistered,
            associationId: (e) => e.customerId,
        },
        listenFor: [CustomerRegistered, CustomerNameChanged],
    })
    start(event: CustomerRegistered) {
        const { customerId } = event;

        const saga = new SagaBuilder();

        saga.step('ChangeCustomerNameStep')
            .thenPublishCommand(
                new ChangeCustomerName(customerId, 'sam', 'graham'),
            )
            .andExpectEvent(CustomerNameChanged);

        saga.step('ChangeCustomerNameStep-2')
            .thenPublishCommand(
                new ChangeCustomerName(customerId, 'sam', 'graham 2'),
            )
            .andExpectEvent(CustomerNameChanged);

        return saga;
    }
}
