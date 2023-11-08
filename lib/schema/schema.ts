import {
    bigint,
    boolean,
    jsonb,
    pgEnum,
    pgTable,
    serial,
    timestamp,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';
import {
    SagaDefinition,
    SagaStepDefinition,
} from '../handlers/saga/handle-saga';

export const streamsTable = pgTable('streams', {
    id: uuid('id').primaryKey(),
    type: varchar('type').notNull(),
    version: bigint('version', { mode: 'number' }).notNull(),
    snapshot: jsonb('snapshot'),
    snapshotVersion: bigint('snapshot_version', { mode: 'number' }),
    timestamp: timestamp('timestamp', { mode: 'string' })
        .notNull()
        .defaultNow(),
    isArchived: boolean('is_archive').notNull().default(false),
});

export const eventsTable = pgTable('events', {
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
});

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

export const sagasTable = pgTable('sagas', {
    id: uuid('id').primaryKey(),
    type: varchar('type').notNull(),
    definition: jsonb('definition').$type<SagaDefinition>().notNull(),
    timestamp: timestamp('timestamp', { mode: 'string' })
        .notNull()
        .defaultNow(),
});
