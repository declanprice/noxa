import {
    getProcessHandlerMetadata,
    getProcessMetadata,
} from './process.decorators';
import { BusMessage } from '../../bus';
import {
    InjectDatabase,
    DatabaseSession,
    EventStore,
    OutboxStore,
    DataStore,
} from '../../store';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { processesTable } from '../../schema/schema';
import { ProcessSession } from './process.session';
import { arrayContains } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { Logger } from '@nestjs/common';

export abstract class HandleProcess {
    private readonly logger = new Logger(HandleProcess.name);

    private readonly metadata = getProcessMetadata(this.constructor);

    constructor(@InjectDatabase() private readonly db: NodePgDatabase<any>) {}

    async handle(message: BusMessage): Promise<void> {
        this.logger.log(
            `(${this.constructor.name}) - received message ${JSON.stringify(
                message,
                null,
                2,
            )}`,
        );

        const handlerMetadata = getProcessHandlerMetadata(
            this.constructor,
            message.type,
        );

        const associationKey = handlerMetadata.associationKey
            ? handlerMetadata.associationKey
            : this.metadata.defaultAssociationKey;

        const associationId = message.data[associationKey];

        if (!associationId) {
            throw new Error(
                `associationKey ${associationKey} does not exist within event data ${message.data}`,
            );
        }

        await this.db.transaction(async (tx) => {
            const processSessions: ProcessSession<any>[] = [];

            const databaseSession: DatabaseSession = {
                dataStore: new DataStore(tx),
                eventStore: new EventStore(tx),
                outboxStore: new OutboxStore(tx),
            };

            const processes = await databaseSession.dataStore
                .query(processesTable)
                .where(
                    arrayContains(processesTable.associations, [associationId]),
                );

            if (!processes.length && handlerMetadata.start === true) {
                const newProcessSession = new ProcessSession<any>(
                    {
                        id: randomUUID(),
                        data: {} as any,
                        hasEnded: false,
                        associations: [],
                    },
                    databaseSession.dataStore,
                    databaseSession.eventStore,
                    databaseSession.outboxStore,
                );

                newProcessSession.associateWith(associationId);

                processSessions.push(newProcessSession);
            }

            for (const process of processes) {
                processSessions.push(
                    new ProcessSession<any>(
                        process,
                        databaseSession.dataStore,
                        databaseSession.eventStore,
                        databaseSession.outboxStore,
                    ),
                );
            }

            for (const processSession of processSessions) {
                await this.handleProcessMessage(processSession, message);
            }
        });
    }

    private async handleProcessMessage(
        processSession: ProcessSession<any>,
        message: BusMessage,
    ): Promise<void> {
        const targetEventHandler = getProcessHandlerMetadata(
            this.constructor,
            message.type,
        );

        await (this as any)[targetEventHandler.method](
            message.data,
            processSession,
        );

        if (processSession.hasEnded) {
            await processSession.dataStore.delete(
                processesTable,
                processSession.id,
            );
        } else {
            await processSession.dataStore.store(processesTable, {
                id: processSession.id,
                type: this.constructor.name,
                data: processSession.data,
                hasEnded: processSession.hasEnded,
                associations: processSession.associations,
            });
        }
    }
}
