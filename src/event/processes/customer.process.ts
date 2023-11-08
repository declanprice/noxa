import {
    HandleProcess,
    Process,
    ProcessEventHandler,
    RabbitmqEventConsumerType,
} from '../../../lib';

import {
    ChangeCustomerName,
    CustomerNameChanged,
    CustomerRegistered,
} from '../../command/customer.stream';

import { ProcessSession } from '../../../lib/handlers/process/process.session';

export interface CustomerProcessData {
    customerId: string;
    firstName: string;
    lastName: string;
}

@Process({
    consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
})
export class CustomerProcess extends HandleProcess<CustomerProcessData> {
    @ProcessEventHandler({
        event: CustomerRegistered,
        associationId: (event) => event.customerId,
        start: true,
    })
    async onRegister(
        event: CustomerRegistered,
        session: ProcessSession<CustomerProcessData>,
    ) {
        console.log('onRegister', event);

        session.data.customerId = event.customerId;
        session.data.firstName = event.firstName;
        session.data.lastName = event.lastName;

        session.associateWith('1');

        await session.outboxStore.publishCommand(
            new ChangeCustomerName(event.customerId, 'changed', 'via process'),
        );
    }

    @ProcessEventHandler({
        event: CustomerNameChanged,
        associationId: (event) => event.customerId,
    })
    async onNameChange(
        event: CustomerNameChanged,
        session: ProcessSession<CustomerProcessData>,
    ) {
        console.log('onNameChangeEvent', event);

        session.data.firstName = event.firstName;
        session.data.lastName = event.lastName;
    }
}
