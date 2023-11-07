// import {
//   Process,
//   ProcessEventHandler,
//   HandleProcess,
//   RabbitmqEventConsumerType,
//   Event,
// } from '../../lib';
//
// import {
//   CustomerNameChanged,
//   CustomerRegistered,
// } from '../model/streams/customer.stream';
//
// import * as dayjs from 'dayjs';
//
// import { CustomerProcessDocument } from '../model/documents/customer-process.data';
//
// class CustomerProcessDeadlineEvent implements Event {
//   constructor(public readonly customerId: string) {}
// }
//
// @Process(CustomerProcessDocument, {
//   consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
// })
// export class CustomerProcess extends HandleProcess {
//   @ProcessEventHandler({
//     event: CustomerRegistered,
//     associationId: (event) => event.customerId,
//     start: true,
//   })
//   async onRegister(
//     event: CustomerRegistered,
//   ) {
//     console.log('onRegister', event);
//
//     const deadlineId = await this.session.outbox.publishEvent(
//       new CustomerProcessDeadlineEvent(event.customerId),
//       { timestamp: dayjs().add(60, 'seconds').toISOString() },
//     );
//
//     const process = new CustomerProcessDocument({
//       customerId: event.customerId,
//       age: event.age,
//       name: event.name,
//       deadlineId
//     });
//
//     process.associateWith('1');
//     process.associateWith('2');
//
//     return process;
//   }
//
//   @ProcessEventHandler({
//     event: CustomerNameChanged,
//     associationId: (event) => event.customerId,
//   })
//   async onNameChange(
//     event: CustomerRegistered,
//     process: CustomerProcessDocument,
//   ) {
//     console.log('onNameChangeEvent', event);
//
//     process.name = event.name;
//
//     if (process.deadlineId) {
//       await this.session.outbox.unpublish(process.deadlineId);
//       process.deadlineId = null;
//     }
//
//     return process;
//   }
//
//   @ProcessEventHandler({
//     event: CustomerProcessDeadlineEvent,
//     associationId: (e) => e.customerId,
//   })
//   onDeadline(
//     event: CustomerProcessDeadlineEvent,
//     process: CustomerProcessDocument,
//   ) {
//     console.log('deadline event handlers', event);
//
//     process.end();
//
//     return process;
//   }
// }

import { ProcessData } from '../../../lib';

export class CustomerProcessData extends ProcessData {
    customerId: string;
    name: string;
    age: number;
    deadlineId: string | null;

    constructor(data: {
        customerId: string;
        name: string;
        age: number;
        deadlineId: string | null;
    }) {
        super();

        this.customerId = data.customerId;
        this.name = data.name;
        this.age = data.age;
        this.deadlineId = data.deadlineId;
    }
}
