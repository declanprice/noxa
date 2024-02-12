import { Injectable, Type } from '@nestjs/common';
import {
    DatabaseClient,
    DatabaseTransactionClient,
} from '../database-client.service';
import { Prisma } from '@prisma/client';
import { StreamNotFoundError } from './errors/stream-not-found.error';
import { StreamNoEventsFoundError } from './errors/stream-no-events-found.error';
import { StreamEventHandlerNotAvailableError } from './errors/stream-event-handler-not-available.error';
import { getStreamHandlerMethod } from './stream/stream.decorators';

@Injectable()
export class EventStore {
    constructor(private readonly db: DatabaseClient) {}

    async startStream(
        steam: Type,
        streamId: string,
        event: any,
        options?: { tx?: DatabaseTransactionClient },
    ) {
        const { tx } = options || {};

        const db = tx ?? this.db;

        const now = new Date().toISOString();

        await db.streams.create({
            data: {
                id: streamId,
                type: steam.name,
                version: 0,
                snapshot: {},
                snapshotVersion: null,
                timestamp: now,
                isArchived: false,
                events: {
                    create: {
                        version: 0,
                        type: event.constructor.name,
                        data: event,
                        timestamp: now,
                        isArchived: false,
                    },
                },
            },
        });
    }

    async hydrateStream<T>(
        stream: Type<T>,
        streamId: string,
        options?: { tx?: DatabaseTransactionClient },
    ): Promise<T> {
        const { tx } = options || {};

        const db = tx ?? this.db;

        const streamType = stream.name;

        const [streamRow, eventRows] = await Promise.all([
            db.streams.findUnique({
                where: {
                    id: streamId,
                    type: streamType,
                },
            }),
            db.events.findMany({
                where: {
                    streamId,
                },
                orderBy: {
                    version: Prisma.SortOrder.asc,
                },
            }),
        ]);

        if (streamRow === null) {
            throw new StreamNotFoundError(streamType, streamId);
        }

        if (eventRows.length === 0) {
            throw new StreamNoEventsFoundError(streamType, streamId);
        }

        let hydratedStream: T = new stream();

        for (const eventRow of eventRows) {
            const method = getStreamHandlerMethod(stream, eventRow.type);

            if (!method) {
                throw new StreamEventHandlerNotAvailableError(
                    streamType,
                    eventRow.type,
                );
            }

            (hydratedStream as any)[method](eventRow.data);
        }

        return hydratedStream;
    }

    async appendEvent(
        stream: Type,
        streamId: string,
        event: any,
        options?: { tx?: DatabaseTransactionClient },
    ): Promise<void> {
        const { tx } = options || {};

        const db = tx ?? this.db;

        const streamType = stream.name;

        const streamRow = await db.streams.findUnique({
            where: {
                id: streamId,
                type: streamType,
            },
        });

        if (streamRow === null) {
            throw new StreamNotFoundError(streamType, streamId);
        }

        const newVersion = Number(streamRow.version) + 1;

        await db.streams.update({
            where: {
                id: streamId,
            },
            data: {
                id: streamId,
                version: newVersion,
                timestamp: new Date().toISOString(),
                events: {
                    create: {
                        type: event.constructor.name,
                        data: event,
                        version: newVersion,
                        timestamp: new Date().toISOString(),
                        isArchived: false,
                    },
                },
            },
        });
    }
}
