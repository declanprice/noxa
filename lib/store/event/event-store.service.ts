import { randomUUID } from 'crypto';
import { Pool, PoolClient } from 'pg';
import { Injectable, Type } from '@nestjs/common';
import { StreamRow } from './stream/stream-row.type';
import { EventRow } from './event/event-row.type';
import { Event } from '../../handlers';
import { StreamNotFoundError } from './errors/stream-not-found.error';
import { StreamNoEventsFoundError } from './errors/stream-no-events-found.error';
import { StreamEventHandlerNotAvailableError } from './errors/stream-event-handler-not-available.error';
import { InjectStoreConnection } from '../store-connection.token';

@Injectable()
export class EventStore {
    constructor(
        @InjectStoreConnection()
        private readonly connection: PoolClient | Pool,
    ) {}

    async startStream(steam: Type, streamId: string, event: Event) {
        const steamType = steam.name;
        const eventType = event.constructor.name;
        const now = new Date().toISOString();

        const storedStream: StreamRow = {
            id: streamId,
            type: steamType,
            version: 0,
            snapshot: null,
            snapshotVersion: null,
            created: now,
            timestamp: now,
            isArchived: false,
        };

        const storedEvent: Partial<EventRow> = {
            id: randomUUID(),
            type: eventType,
            data: event,
            version: 0,
            streamId,
            timestamp: now,
            isArchived: false,
        };

        await this.connection.query({
            text: `insert into noxa_event_streams (
        "id",
        "type",
        "version",
        "snapshot",
        "snapshotVersion",
        "created",
        "timestamp",
        "isArchived"
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
            values: [
                storedStream.id,
                storedStream.type,
                storedStream.version,
                storedStream.snapshot,
                storedStream.snapshotVersion,
                storedStream.created,
                storedStream.timestamp,
                storedStream.isArchived,
            ],
        });

        await this.connection.query({
            text: `insert into noxa_events (
        "id",
        "streamId",
        "version",
        "timestamp",
        "data",
        "type",
        "isArchived" 
      ) values ($1, $2, $3, $4, $5, $6, $7)`,
            values: [
                storedEvent.id,
                storedEvent.streamId,
                storedEvent.version,
                storedEvent.timestamp,
                storedEvent.data,
                storedEvent.type,
                storedEvent.isArchived,
            ],
        });
    }

    async hydrateStream<T>(stream: Type<T>, streamId: string): Promise<T> {
        const streamType = stream.name;

        const [streamResult, eventsResult] = await Promise.all([
            this.connection.query({
                text: `select * from noxa_event_streams where type = $1 and id = $2`,
                values: [streamType, streamId],
            }),
            this.connection.query({
                text: `select * from noxa_events where "streamId" = $1 order by version ASC`,
                values: [streamId],
            }),
        ]);

        if (streamResult.rowCount === 0) {
            throw new StreamNotFoundError(streamType, streamId);
        }

        if (eventsResult.rowCount === 0) {
            throw new StreamNoEventsFoundError(streamType, streamId);
        }

        let hydratedStream: T = new stream();

        for (const eventRow of eventsResult.rows as EventRow[]) {
            const streamEventHandler = Reflect.getMetadata(
                eventRow.type,
                stream,
            );

            if (!streamEventHandler) {
                throw new StreamEventHandlerNotAvailableError(
                    streamType,
                    eventRow.type,
                );
            }

            (hydratedStream as any)[streamEventHandler](eventRow.data);
        }

        return hydratedStream;
    }

    async appendEvent(
        stream: Type,
        streamId: string,
        event: Event,
    ): Promise<void> {
        const streamType = stream.name;
        const eventType = event.constructor.name;
        const now = new Date().toISOString();

        const streamResult = await this.connection.query({
            text: `select * from noxa_event_streams where type = $1 and id = $2 for update`,
            values: [streamType, streamId],
        });

        if (streamResult.rowCount === 0) {
            throw new StreamNotFoundError(streamType, streamId);
        }

        const streamRow = streamResult.rows[0] as StreamRow;

        const newVersion = Number(streamRow.version) + 1;

        const storedEvent: Partial<EventRow> = {
            id: randomUUID(),
            type: eventType,
            data: event,
            version: newVersion,
            streamId,
            timestamp: now,
            isArchived: false,
        };

        const storedStream: Partial<StreamRow> = {
            id: streamId,
            type: streamType,
            timestamp: new Date().toISOString(),
            version: newVersion,
        };

        await this.connection.query({
            text: `insert into noxa_events (
        "id",
        "streamId",
        "version",
        "timestamp",
        "data",
        "type",
        "isArchived"
      ) values ($1, $2, $3, $4, $5, $6, $7)`,
            values: [
                storedEvent.id,
                storedEvent.streamId,
                storedEvent.version,
                storedEvent.timestamp,
                storedEvent.data,
                storedEvent.type,
                storedEvent.isArchived,
            ],
        });

        await this.connection.query({
            text: `update noxa_event_streams set version = $1, timestamp = $2 where type = $3 and id = $4`,
            values: [
                storedStream.version,
                storedStream.timestamp,
                storedStream.type,
                storedStream.id,
            ],
        });
    }

    static async createResources(connection: PoolClient) {
        await connection.query({
            text: `
        CREATE TABLE IF NOT EXISTS noxa_event_streams (
            "id" uuid not null constraint noxa_event_streams_pk primary key,
            "type" varchar(500) not null,
            "version" bigint not null,
            "snapshot" jsonb null,
            "snapshotVersion" bigint null,
            "created" timestamp with time zone not null,
            "timestamp" timestamp with time zone not null,
            "isArchived" boolean default false not null
      )`,
            values: [],
        });

        await connection.query({
            text: `
        CREATE TABLE IF NOT EXISTS noxa_events (
            "sequenceId" bigserial not null constraint noxa_events_pk primary key,
            "id" uuid not null,
            "streamId" uuid not null,
            "version" bigint not null,
            "timestamp" timestamp with time zone not null,
            "data" jsonb not null,
            "type" varchar(500) not null,
            "isArchived" boolean default false not null
      )`,
            values: [],
        });

        await connection.query({
            text: `
        CREATE TABLE IF NOT EXISTS noxa_projection_tokens (
            "name" varchar(250) not null constraint noxa_projection_tokens_pk primary key,
            "lastSequenceId" bigserial not null,
            "lastUpdated" timestamp with time zone not null
      )`,
            values: [],
        });
    }
}
