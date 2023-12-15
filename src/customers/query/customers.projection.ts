import { DataProjection, ProjectionEventHandler } from '../../../lib';

import { Customer, customers } from '../../schema';

import { CustomerRegistered } from '../api/events/customer-registered.event';

@DataProjection(customers)
export class CustomersProjection {
    @ProjectionEventHandler(CustomerRegistered, (e) => e.customerId)
    onRegistered(event: CustomerRegistered): Customer {
        return {
            id: event.customerId,
            firstName: event.firstName,
            lastName: event.lastName,
            email: event.email,
        };
    }
}
