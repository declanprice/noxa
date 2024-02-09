import {
    getProcessHandlerMetadata,
    getProcessMetadata,
} from './process.decorators';
import { ProcessSession, ProcessState } from './process.session';
import { Inject, Logger } from '@nestjs/common';
import {
    DatabaseClient,
    DatabaseTransactionClient,
} from '../../store/database-client.service';
import { EventMessage } from '../event';
import { randomUUID } from 'crypto';

export abstract class HandleProcess {
    private readonly logger = new Logger(HandleProcess.name);

    private readonly metadata = getProcessMetadata(this.constructor);

    constructor(@Inject(DatabaseClient) private readonly db: DatabaseClient) {}

    async handle(event: EventMessage<any>): Promise<void> {
        this.logger.log(
            `(${this.constructor.name}) - received event ${JSON.stringify(
                event,
                null,
                2,
            )}`,
        );

        const metadata = getProcessHandlerMetadata(
            this.constructor,
            event.type,
        );

        const associationKey = metadata.associationKey
            ? metadata.associationKey
            : this.metadata.defaultAssociationKey;

        const associationId = event.data[associationKey];

        if (!associationId) {
            return this.logger.log(
                `(${this.constructor.name}) - associationKey ${associationKey} not found in message data, skipping message.`,
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
                await this.handleSession(tx, session);
            }
        });
    }

    private async handleSession(
        tx: DatabaseTransactionClient,
        session: ProcessSession<any, any>,
    ): Promise<void> {
        const { method } = getProcessHandlerMetadata(
            this.constructor,
            session.event.type,
        );

        await (this as any)[method](session);

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
                    type: this.constructor.name,
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
