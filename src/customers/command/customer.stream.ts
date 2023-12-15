import { Stream, StreamEventHandler } from '../../../lib';

import { CustomerRegistered } from '../api/events/customer-registered.event';

@Stream()
export class CustomerStream {
    customerId: string;
    firstName: string;
    lastName: string;
    email: string;

    @StreamEventHandler(CustomerRegistered)
    onRegistered(event: CustomerRegistered) {
        this.customerId = event.customerId;
        this.firstName = event.firstName;
        this.lastName = event.firstName;
        this.firstName = event.firstName;
    }
}
