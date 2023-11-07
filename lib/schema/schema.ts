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

export const streams = pgTable('streams', {
    id: uuid('id').primaryKey(),
    type: varchar('type').notNull(),
    version: bigint('version', { mode: 'number' }).notNull(),
    snapshot: jsonb('snapshot'),
    snapshotVersion: bigint('snapshot_version', { mode: 'number' }),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    isArchived: boolean('is_archive').notNull().default(false),
});

export const events = pgTable('events', {
    sequenceId: serial('sequence_id').primaryKey(),
    id: uuid('id').unique(),
    streamId: uuid('stream_id')
        .notNull()
        .references(() => streams.id),
    version: bigint('version', { mode: 'number' }).notNull(),
    data: jsonb('data').notNull().default({}),
    type: varchar('type').notNull(),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    isArchived: boolean('is_archived').notNull().default(false),
});

export const outbox = pgTable('outbox', {
    id: uuid('id').primaryKey(),
    toBus: pgEnum('toBusEnum', ['command', 'event'])('to_bus')
        .notNull()
        .$type<'command' | 'event'>(),
    timestamp: timestamp('timestamp').defaultNow(),
    type: varchar('type').notNull(),
    data: jsonb('data').notNull().default({}),
    published: boolean('published').notNull().default(false),
    publishedTimestamp: timestamp('published_timestamp'),
});

export const tokens = pgTable('tokens', {
    name: varchar('name').notNull().primaryKey(),
    lastSequenceId: bigint('last_sequence_id', { mode: 'number' }).default(0),
    timestamp: timestamp('timestamp').defaultNow(),
});

export const processes = pgTable('processes', {
    id: uuid('id').primaryKey(),
    type: varchar('type').notNull(),
    data: jsonb('data').notNull().default({}),
    associations: jsonb('associations').notNull().default([]).$type<string[]>(),
    hasEnded: boolean('has_ended').notNull().default(false),
    timestamp: timestamp('timestamp').defaultNow(),
});

export const sagas = pgTable('sagas', {
    id: uuid('id').primaryKey(),
    type: varchar('type').notNull(),
    data: jsonb('data').notNull().default({}),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
});
