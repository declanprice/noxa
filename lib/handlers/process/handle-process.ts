import {
    getProcessHandlerMetadata,
    ProcessMetadata,
} from './process.decorators';
import { ProcessSession, ProcessState } from './process.session';
import { Logger } from '@nestjs/common';
import {
    DatabaseClient,
    DatabaseTransactionClient,
} from '../../store/database-client.service';
import { EventMessage } from '../event';
import { randomUUID } from 'crypto';
import { BusMessage } from '../../bus';

export class HandleProcess {
    private readonly logger = new Logger(HandleProcess.name);

    constructor(private readonly db: DatabaseClient) {}

    async handle(
        instance: any,
        instanceMetadata: ProcessMetadata,
        message: BusMessage,
    ): Promise<void> {
        this.logger.log(
            `(${instance.constructor.name}) - received message ${JSON.stringify(
                message,
                null,
                2,
            )}`,
        );

        const event: EventMessage<any> = {
            type: message.type,
            data: message.data,
        };

        const metadata = getProcessHandlerMetadata(
            instance.constructor,
            event.type,
        );

        const associationKey = metadata.associationKey
            ? metadata.associationKey
            : instanceMetadata.defaultAssociationKey;

        const associationId = event.data[associationKey];

        if (!associationId) {
            return this.logger.log(
                `(${instance.constructor.name}) - associationKey ${associationKey} not found in message data, skipping message.`,
            );
        }

        await this.db.$transaction(async (tx) => {
            const sessions: ProcessSession<any, any>[] = [];

            const processes = await tx.processes.findMany({
                where: {
                    associations: {
                        array_contains: associationId,
                    },
                },
            });

            if (!processes.length && metadata.start === true) {
                const state: ProcessState<any> = {
                    id: randomUUID(),
                    data: {} as any,
                    hasEnded: false,
                    associations: [],
                };

                const session = new ProcessSession<any, any>(event, state, tx);

                session.associateWith(associationId);

                sessions.push(session);
            }

            for (const process of processes) {
                sessions.push(
                    new ProcessSession<any, any>(
                        event,
                        process as ProcessState<any>,
                        tx,
                    ),
                );
            }

            for (const session of sessions) {
                await this.handleSession(
                    instance,
                    metadata.method,
                    tx,
                    session,
                );
            }
        });
    }

    private async handleSession(
        instance: any,
        method: string,
        tx: DatabaseTransactionClient,
        session: ProcessSession<any, any>,
    ): Promise<void> {
        await instance[method](session);

        if (session.hasEnded) {
            await tx.processes.delete({
                where: {
                    id: session.id,
                },
            });
        } else {
            await tx.processes.upsert({
                where: {
                    id: session.id,
                },
                create: {
                    id: session.id,
                    type: instance.constructor.name,
                    data: session.data,
                    hasEnded: session.hasEnded,
                    associations: session.associations,
                    timestamp: new Date().toISOString(),
                },
                update: {
                    data: session.data,
                    hasEnded: session.hasEnded,
                    associations: session.associations,
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
}
