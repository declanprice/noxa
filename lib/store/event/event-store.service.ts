import { randomUUID } from 'crypto';
import { Injectable, Type } from '@nestjs/common';
import { StreamNotFoundError } from './errors/stream-not-found.error';
import { StreamNoEventsFoundError } from './errors/stream-no-events-found.error';
import { StreamEventHandlerNotAvailableError } from './errors/stream-event-handler-not-available.error';
import { DatabaseService, DatabaseTransactionClient } from '../database.service';

@Injectable()
export class EventStore {
    constructor(
        private readonly db: DatabaseService
    ) {}

    async startStream(
        steam: Type,
        streamId: string,
        event: Event,
        options?: { tx?: DatabaseTransactionClient },
    ) {
        const { tx } = options || {};

        const db = tx ?? this.db;

        const now = new Date().toISOString();

        // await db.insert(streamsTable).values({
        //     id: streamId,
        //     type: steam.name,
        //     version: 0,
        //     snapshot: null,
        //     snapshotVersion: null,
        //     timestamp: now,
        //     isArchived: false,
        // });
        //
        // await db.insert(eventsTable).values({
        //     id: randomUUID(),
        //     streamId,
        //     version: 0,
        //     data: event,
        //     type: event.constructor.name,
        //     timestamp: now,
        //     isArchived: false,
        // });
    }

    // async hydrateStream<T>(
    //     stream: Type<T>,
    //     streamId: string,
    //     options?: { tx?: DatabaseTransactionClient },
    // ): Promise<T> {
    //     const { tx } = options || {};
    //
    //     const db = tx ?? this.db;
    //
    //     const streamType = stream.name;
    //
    //     const [streamRows, eventRows] = await Promise.all([
    //         db
    //             .select()
    //             .from(streamsTable)
    //             .where(
    //                 and(
    //                     eq(streamsTable.id, streamId),
    //                     eq(streamsTable.type, streamType),
    //                 ),
    //             ),
    //         db
    //             .select()
    //             .from(eventsTable)
    //             .where(and(eq(eventsTable.streamId, streamId)))
    //             .orderBy(asc(eventsTable.version)),
    //     ]);
    //
    //     if (streamRows.length === 0) {
    //         throw new StreamNotFoundError(streamType, streamId);
    //     }
    //
    //     if (eventRows.length === 0) {
    //         throw new StreamNoEventsFoundError(streamType, streamId);
    //     }
    //
    //     let hydratedStream: T = new stream();
    //
    //     for (const eventRow of eventRows) {
    //         const streamEventHandler = Reflect.getMetadata(
    //             eventRow.type,
    //             stream,
    //         );
    //
    //         if (!streamEventHandler) {
    //             throw new StreamEventHandlerNotAvailableError(
    //                 streamType,
    //                 eventRow.type,
    //             );
    //         }
    //
    //         (hydratedStream as any)[streamEventHandler](eventRow.data);
    //     }
    //
    //     return hydratedStream;
    // }

    // async appendEvent(
    //     stream: Type,
    //     streamId: string,
    //     event: Event,
    //     options?: { tx?: PgTransaction<any, any, any> },
    // ): Promise<void> {
    //     const { tx } = options || {};
    //
    //     const db = tx ?? this.db;
    //
    //     const streamType = stream.name;
    //
    //     const streamRows = await db
    //         .select()
    //         .from(streamsTable)
    //         .where(
    //             and(
    //                 eq(streamsTable.id, streamId),
    //                 eq(streamsTable.type, streamType),
    //             ),
    //         );
    //
    //     if (streamRows.length === 0) {
    //         throw new StreamNotFoundError(streamType, streamId);
    //     }
    //
    //     const streamRow = streamRows[0];
    //
    //     const newVersion = Number(streamRow.version) + 1;
    //
    //     await db
    //         .update(streamsTable)
    //         .set({
    //             id: streamId,
    //             version: newVersion,
    //             timestamp: new Date().toISOString(),
    //         })
    //         .where(eq(streamsTable.id, streamId));
    //
    //     await db.insert(eventsTable).values({
    //         id: randomUUID(),
    //         type: event.constructor.name,
    //         data: event,
    //         version: newVersion,
    //         streamId,
    //         timestamp: new Date().toISOString(),
    //         isArchived: false,
    //     });
    // }
}
