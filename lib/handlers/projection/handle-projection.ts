import { events } from '@prisma/client';
import { ProjectionUnsupportedEventError } from '../../async-daemon/errors/projection-unsupported-event.error';
import {
    DatabaseClient,
    DatabaseTransactionClient,
} from '../../store/database-client.service';
import { getProjectionHandlerMethod } from './projection.decorators';
import { ProjectionSession } from './projection-session.type';

export class HandleProjection {
    async handleEvents(
        db: DatabaseClient,
        projectionInstance: any,
        projectionType: string,
        events: events[],
    ) {
        return db.$transaction(async (tx) => {
            for (const event of events) {
                const method = getProjectionHandlerMethod(
                    projectionInstance.constructor,
                    event.type,
                );

                if (!method) {
                    throw new ProjectionUnsupportedEventError(
                        projectionType,
                        event.type,
                    );
                }

                const session: ProjectionSession<any> = {
                    tx,
                    event: {
                        type: event.type,
                        data: event.data,
                    },
                };

                await projectionInstance[method](session);
            }

            return await this.updateTokenPosition(
                tx,
                projectionType,
                events[events.length - 1].id,
            );
        });
    }

    async updateTokenPosition(
        tx: DatabaseTransactionClient,
        projectionType: string,
        lastSequenceId: bigint,
    ) {
        return tx.tokens.update({
            where: {
                name: projectionType,
            },
            data: {
                name: projectionType,
                lastSequenceId,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
