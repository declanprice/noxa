import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export {
    events,
    streams,
    outbox,
    tokens,
    processes,
    sagas,
} from '../lib/schema/schema';

export const customers = pgTable('customers', {
    id: uuid('id').primaryKey(),
    firstName: varchar('first_name').notNull(),
    lastName: varchar('last_name').notNull(),
    dateOfBirth: timestamp('date_of_birth').notNull(),
    hobbies: jsonb('hobbies').notNull().default([]).$type<string[]>(),
});
