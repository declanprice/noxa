import { DataProjection, ProjectionEventHandler } from '../../../lib';

import { customersTable } from '../../schema';

import {
    CustomerNameChanged,
    CustomerRegistered,
} from '../../command/customer.stream';

import { InferInsertModel } from 'drizzle-orm';

type CustomerData = InferInsertModel<typeof customersTable>;

@DataProjection(customersTable)
export class CustomerProjection {
    @ProjectionEventHandler(CustomerRegistered, (e) => e.customerId)
    onRegistered(event: CustomerRegistered): CustomerData {
        return {
            id: event.customerId,
            firstName: event.firstName,
            lastName: event.lastName,
            hobbies: event.hobbies,
            dateOfBirth: event.dateOfBirth,
        };
    }

    @ProjectionEventHandler(CustomerNameChanged, (e) => e.customerId)
    onNameChanged(
        event: CustomerNameChanged,
        existing: CustomerData,
    ): CustomerData {
        return {
            id: existing.id,
            firstName: event.firstName,
            lastName: event.lastName,
            dateOfBirth: existing.dateOfBirth,
            hobbies: existing.hobbies,
        };
    }
}
