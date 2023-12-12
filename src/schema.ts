import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export {
    eventsTable,
    streamsTable,
    outboxTable,
    tokensTable,
    processesTable,
} from '../lib/schema/schema';

export const customersTable = pgTable('customers', {
    id: uuid('id').primaryKey(),
    firstName: varchar('first_name').notNull(),
    lastName: varchar('last_name').notNull(),
    dateOfBirth: timestamp('date_of_birth', { mode: 'string' })
        .notNull()
        .defaultNow(),
    hobbies: jsonb('hobbies').notNull().default([]).$type<string[]>(),
});
