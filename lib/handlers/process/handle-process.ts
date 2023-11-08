import { getProcessEventHandlerMetadata } from './process.decorators';
import { BusMessage } from '../../bus';
import {
    InjectDatabase,
    DataStore,
    EventStore,
    OutboxStore,
    DatabaseSession,
} from '../../store';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { processesTable } from '../../schema/schema';
import { arrayContains } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ProcessSession } from './process.session';

export abstract class HandleProcess<Data> {
    constructor(@InjectDatabase() private readonly db: NodePgDatabase<any>) {}

    async handle(message: BusMessage): Promise<void> {
        await this.db.transaction(async (tx) => {
            const handlerMetadata = getProcessEventHandlerMetadata(
                this.constructor,
                message.type,
            );

            const associationId = handlerMetadata.associationId(message.data);

            const processSessions: ProcessSession<Data>[] = [];

            const databaseSession: DatabaseSession = {
                data: new DataStore(tx),
                event: new EventStore(tx),
                outbox: new OutboxStore(tx),
            };

            const processes = await databaseSession.data
                .query(processesTable)
                .where(
                    arrayContains(processesTable.associations, [associationId]),
                );

            if (!processes.length && handlerMetadata.start === true) {
                const newProcessSession = new ProcessSession<Data>(
                    {
                        id: randomUUID(),
                        data: {} as any,
                        associations: [],
                        hasEnded: false,
                    },
                    databaseSession.data,
                    databaseSession.event,
                    databaseSession.outbox,
                );

                newProcessSession.associateWith(associationId);

                processSessions.push(newProcessSession);
            }

            for (const process of processes) {
                processSessions.push(
                    new ProcessSession<Data>(
                        process,
                        databaseSession.data,
                        databaseSession.event,
                        databaseSession.outbox,
                    ),
                );
            }

            for (const processSession of processSessions) {
                await this.handleProcessMessage(
                    databaseSession,
                    processSession,
                    message,
                );
            }
        });
    }

    private async handleProcessMessage(
        databaseSession: DatabaseSession,
        processSession: ProcessSession<Data>,
        message: BusMessage,
    ): Promise<void> {
        const targetEventHandler = getProcessEventHandlerMetadata(
            this.constructor as any,
            message.type,
        );

        await (this as any)[targetEventHandler.propertyKey](
            message.data,
            processSession,
        );

        if (processSession.hasEnded) {
            await databaseSession.data.delete(
                processesTable,
                processSession.id,
            );
        } else {
            await databaseSession.data.store(processesTable, {
                id: processSession.id,
                type: this.constructor.name,
                data: processSession.data,
                hasEnded: processSession.hasEnded,
                associations: processSession.associations,
            });
        }
    }
}
