// import { NodePgDatabase } from 'drizzle-orm/node-postgres';
//
// import {
//     DataStore,
//     EventStore,
//     InjectDatabase,
//     OutboxStore,
// } from '../../../store';
// import { BusMessage } from '../../../bus';
// import { getEventGroupHandler } from './event-group.decorator';
// import { GroupCannotHandleEventTypeError } from '../../../bus/services/errors/group-cannot-handle-event-type.error';
//
// export abstract class HandleEventGroup {
//     constructor(@InjectDatabase() public readonly db: NodePgDatabase) {}
//
//     async handle(message: BusMessage): Promise<void> {
//         const handler = getEventGroupHandler(this.constructor, message.type);
//
//         if (!handler) {
//             throw new GroupCannotHandleEventTypeError(
//                 this.constructor.name,
//                 message.type,
//             );
//         }
//
//         await this.db.transaction(async (tx) => {
//             await (this as any)[handler](message.data, {
//                 data: new DataStore(tx),
//                 event: new EventStore(tx),
//                 outbox: new OutboxStore(tx),
//             });
//         });
//     }
// }
