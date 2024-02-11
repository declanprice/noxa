import { events } from '@prisma/client';
import { ProjectionUnsupportedEventError } from '../../async-daemon/errors/projection-unsupported-event.error';
import {
    DatabaseClient,
    DatabaseTransactionClient,
} from '../../store/database-client.service';
import { getProjectionHandlerMethod } from './projection.decorators';
import { ProjectionSession } from './projection-session.type';

export const handleProjection = async (
    db: DatabaseClient,
    projection: any,
    events: events[],
) => {
    return db.$transaction(async (tx) => {
        for (const event of events) {
            const method = getProjectionHandlerMethod(
                projection.constructor,
                event.type,
            );

            if (!method) {
                throw new ProjectionUnsupportedEventError(
                    projection.constructor,
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

            await projection[method](session);
        }

        return await updateTokenPosition(
            tx,
            projection,
            events[events.length - 1].id,
            events[events.length - 1].transactionId,
        );
    });
};

const updateTokenPosition = async (
    tx: DatabaseTransactionClient,
    projection: any,
    lastEventId: bigint,
    lastTransactionId: string,
) => {
    const name = projection.constructor.name;

    return tx.tokens.update({
        where: {
            name,
        },
        data: {
            name,
            lastEventId,
            lastTransactionId,
            timestamp: new Date().toISOString(),
        },
    });
};
