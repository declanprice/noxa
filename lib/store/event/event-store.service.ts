import { randomUUID } from 'crypto';
import { Injectable, Type } from '@nestjs/common';
import { StreamRow } from './stream/stream-row.type';
import { EventRow } from './event/event-row.type';
import { Event } from '../../handlers';
import { StreamNotFoundError } from './errors/stream-not-found.error';
import { StreamNoEventsFoundError } from './errors/stream-no-events-found.error';
import { StreamEventHandlerNotAvailableError } from './errors/stream-event-handler-not-available.error';
import { InjectDatabase } from '../database.token';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTransaction } from 'drizzle-orm/pg-core/session';
import { events, streams } from '../../schema/schema';
import { and, asc, eq } from 'drizzle-orm';

@Injectable()
export class EventStore {
    constructor(
        @InjectDatabase()
        private readonly db: NodePgDatabase<any> | PgTransaction<any>,
    ) {}

    async startStream(
        steam: Type,
        streamId: string,
        event: Event,
        options?: { tx?: PgTransaction<any> },
    ) {
        const { tx } = options || {};

        const db = tx ?? this.db;

        const now = new Date();

        await db.insert(streams).values({
            id: streamId,
            type: steam.name,
            version: 0,
            snapshot: null,
            snapshotVersion: null,
            timestamp: now,
            isArchived: false,
        });

        await db.insert(events).values({
            id: randomUUID(),
            streamId,
            version: 0,
            data: event,
            type: event.constructor.name,
            timestamp: now,
            isArchived: false,
        });
    }

    async hydrateStream<T>(
        stream: Type<T>,
        streamId: string,
        options?: { tx?: PgTransaction<any> },
    ): Promise<T> {
        const { tx } = options || {};

        const db = tx ?? this.db;

        const streamType = stream.name;

        const [streamRows, eventRows] = await Promise.all([
            db
                .select()
                .from(streams)
                .where(
                    and(eq(streams.id, streamId), eq(streams.type, streamType)),
                ),
            db
                .select()
                .from(events)
                .where(and(eq(events.streamId, streamId)))
                .orderBy(asc(events.version)),
        ]);

        if (streamRows.length === 0) {
            throw new StreamNotFoundError(streamType, streamId);
        }

        if (eventRows.length === 0) {
            throw new StreamNoEventsFoundError(streamType, streamId);
        }

        let hydratedStream: T = new stream();

        for (const eventRow of eventRows) {
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
        options?: { tx?: PgTransaction<any> },
    ): Promise<void> {
        const { tx } = options || {};

        const db = tx ?? this.db;

        const streamType = stream.name;

        const streamRows = await db
            .select()
            .from(streams)
            .where(and(eq(streams.id, streamId), eq(streams.type, streamType)));

        if (streamRows.length === 0) {
            throw new StreamNotFoundError(streamType, streamId);
        }

        const streamRow = streamRows[0];

        const newVersion = Number(streamRow.version) + 1;

        await db
            .update(streams)
            .set({
                id: streamId,
                version: newVersion,
                timestamp: new Date(),
            })
            .where(eq(streams.id, streamId));

        await db.insert(events).values({
            id: randomUUID(),
            type: event.constructor.name,
            data: event,
            version: newVersion,
            streamId,
            timestamp: new Date(),
            isArchived: false,
        });
    }
}
