// import {
//     RabbitmqEventConsumerType,
//     HandleSaga,
//     SagaBuilder,
//     Saga,
//     StartSagaHandler,
// } from '../../lib';
//
// import {
//     ChangeCustomerAge,
//     ChangeCustomerName,
//     CustomerAgeChanged,
//     CustomerNameChanged,
//     CustomerRegistered,
// } from '../model/streams/customer.stream';
//
// @Saga({ consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER })
// export class CustomerSaga extends HandleSaga {
//     @StartSagaHandler({
//         startOn: {
//             event: CustomerRegistered,
//             associationId: (e) => e.customerId,
//         },
//         listenFor: [
//             CustomerRegistered,
//             CustomerNameChanged,
//             CustomerAgeChanged,
//         ],
//     })
//     start(event: CustomerRegistered) {
//         const { customerId } = event;
//
//         const saga = new SagaBuilder();
//
//         saga.step('ChangeCustomerNameStep')
//             .thenPublishCommand(new ChangeCustomerName(customerId, 'sam'))
//             .andExpectEvent(CustomerNameChanged);
//
//         saga.step('ChangeCustomerAgeStep')
//             .thenPublishCommand(new ChangeCustomerAge(customerId, 33))
//             .andExpectEvent(CustomerAgeChanged);
//
//         return saga;
//     }
// }
