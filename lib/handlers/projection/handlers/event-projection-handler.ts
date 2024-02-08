// import { ProjectionHandler } from './projection-handler';
// import { Pool, PoolClient } from 'pg';
// import { Type } from '@nestjs/common';
// import { StoredProjectionToken } from '../stored-projection-token';
// import { ProjectionUnsupportedEventError } from '../../../async-daemon/errors/projection-unsupported-event.error';
// import { EventRow } from '../../../store/event/event/event-row.type';
// import { NodePgDatabase } from 'drizzle-orm/node-postgres';
// import { PgTransaction } from 'drizzle-orm/pg-core/session';
// import { InferSelectModel } from 'drizzle-orm';
// import { eventsTable } from '../../../schema/schema';
//
// export class EventProjectionHandler extends ProjectionHandler {
//     async handleEvents(
//         db: NodePgDatabase<any> | PgTransaction<any>,
//         projection: any,
//         projectionType: Type,
//         events: InferSelectModel<typeof eventsTable>[],
//     ) {
//         for (const event of events) {
//             const targetEventHandler = Reflect.getMetadata(
//                 event.type,
//                 projectionType,
//             );
//
//             if (!targetEventHandler) {
//                 throw new ProjectionUnsupportedEventError(
//                     projectionType.name,
//                     event.type,
//                 );
//             }
//
//             await projection[targetEventHandler.propertyKey](event.data);
//         }
//
//         return await this.updateTokenPosition(
//             db,
//             projectionType,
//             events[events.length - 1].sequenceId,
//         );
//     }
// }
