import {
    HandleProcess,
    Process,
    RabbitmqEventConsumerType,
} from '../../../lib';
import {
    ChangeCustomerName,
    CustomerNameChanged,
    CustomerRegistered,
} from '../../command/customer.stream';
import { ProcessSession } from '../../../lib/handlers/process/process.session';
import { ProcessHandler } from '../../../lib/handlers/process/process.decorators';

export type CustomerProcessData = {
    customerId: string;
    firstName: string;
    lastName: string;
};

@Process({
    consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
    defaultAssociationKey: 'customerId',
})
export class CustomerProcess extends HandleProcess {
    @ProcessHandler(CustomerRegistered, {
        start: true,
    })
    async onRegister(
        event: CustomerRegistered,
        session: ProcessSession<CustomerProcessData>,
    ) {
        session.update({
            customerId: event.customerId,
            firstName: event.firstName,
            lastName: event.lastName,
        });

        await session.outboxStore.publishCommand(
            new ChangeCustomerName(event.customerId, 'changed', 'via process'),
        );
    }

    @ProcessHandler(CustomerNameChanged)
    async onNameChange(
        event: CustomerNameChanged,
        session: ProcessSession<CustomerProcessData>,
    ) {
        session.update({
            firstName: event.firstName,
            lastName: event.lastName,
        });
    }
}
