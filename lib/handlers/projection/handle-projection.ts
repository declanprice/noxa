import { events } from '@prisma/client';
import { ProjectionUnsupportedEventError } from '../../async-daemon/errors/projection-unsupported-event.error';
import {
    DatabaseClient,
    DatabaseTransactionClient,
} from '../../store/database-client.service';
import { getProjectionHandlerMethod } from './projection.decorators';
import { EventMessage } from '../event';

export class HandleProjection {
    async handleEvents(
        db: DatabaseClient | DatabaseTransactionClient,
        projectionInstance: any,
        projectionType: string,
        events: events[],
    ) {
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

            const eventMessage: EventMessage<any> = {
                type: event.type,
                data: event.data,
            };

            await projectionInstance[method](eventMessage);
        }

        return await this.updateTokenPosition(
            db,
            projectionType,
            events[events.length - 1].id,
        );
    }

    async updateTokenPosition(
        db: DatabaseClient | DatabaseTransactionClient,
        projectionType: string,
        lastSequenceId: bigint,
    ) {
        return db.tokens.update({
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
