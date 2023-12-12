import {
    bigint,
    boolean,
    jsonb,
    pgTable,
    serial,
    timestamp,
    unique,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';

export const streamsTable = pgTable(
    'streams',
    {
        id: uuid('id').primaryKey(),
        type: varchar('type').notNull(),
        version: bigint('version', { mode: 'number' }).notNull(),
        snapshot: jsonb('snapshot'),
        snapshotVersion: bigint('snapshot_version', { mode: 'number' }),
        timestamp: timestamp('timestamp', { mode: 'string' })
            .notNull()
            .defaultNow(),
        isArchived: boolean('is_archive').notNull().default(false),
    },
    (table) => ({
        idTypeUnique: unique('id_type_unique').on(table.id, table.type),
    }),
);

export const eventsTable = pgTable(
    'events',
    {
        sequenceId: serial('sequence_id').primaryKey(),
        id: uuid('id').unique(),
        streamId: uuid('stream_id')
            .notNull()
            .references(() => streamsTable.id),
        version: bigint('version', { mode: 'number' }).notNull(),
        data: jsonb('data').notNull().default({}),
        type: varchar('type').notNull(),
        timestamp: timestamp('timestamp', { mode: 'string' })
            .notNull()
            .defaultNow(),
        isArchived: boolean('is_archived').notNull().default(false),
    },
    (table) => ({
        streamIdVersion: unique().on(table.streamId, table.version),
    }),
);

export const outboxTable = pgTable('outbox', {
    id: uuid('id').primaryKey(),
    toBus: varchar('to_bus').notNull().$type<'command' | 'event'>(),
    timestamp: timestamp('timestamp', { mode: 'string' })
        .notNull()
        .defaultNow(),
    type: varchar('type').notNull(),
    data: jsonb('data').notNull().default({}),
    published: boolean('published').notNull().default(false),
    publishedTimestamp: timestamp('published_timestamp', { mode: 'string' }),
});

export const tokensTable = pgTable('tokens', {
    name: varchar('name').notNull().primaryKey(),
    lastSequenceId: bigint('last_sequence_id', { mode: 'number' })
        .notNull()
        .default(0),
    timestamp: timestamp('timestamp', { mode: 'string' })
        .notNull()
        .defaultNow(),
});

export const processesTable = pgTable('processes', {
    id: uuid('id').primaryKey(),
    type: varchar('type').notNull(),
    data: jsonb('data').notNull().default({}),
    associations: jsonb('associations').notNull().default([]).$type<string[]>(),
    hasEnded: boolean('has_ended').notNull().default(false),
    timestamp: timestamp('timestamp', { mode: 'string' }).defaultNow(),
});

export type SelectEvent = typeof eventsTable.$inferSelect;

export type InsertEvent = typeof eventsTable.$inferInsert;

export type SelectToken = typeof tokensTable.$inferSelect;

export type InsertToken = typeof tokensTable.$inferInsert;