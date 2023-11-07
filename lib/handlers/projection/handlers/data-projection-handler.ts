import { Type } from '@nestjs/common';
import { ProjectionHandler } from './projection-handler';
import { ProjectionUnsupportedEventError } from '../../../async-daemon/errors/projection-unsupported-event.error';
import { ProjectionInvalidIdError } from '../../../async-daemon/errors/projection-invalid-id.error';
import { DataStore } from '../../../store';
import { getProjectionDataMetadata } from '../projection.decorators';
import { InferSelectModel } from 'drizzle-orm';
import { eventsTable } from '../../../schema/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTransaction } from 'drizzle-orm/pg-core/session';

export class DataProjectionHandler extends ProjectionHandler {
    constructor(private readonly dataStore: DataStore) {
        super();
    }

    async handleEvents(
        db: NodePgDatabase<any> | PgTransaction<any>,
        projection: any,
        projectionType: Type,
        events: InferSelectModel<typeof eventsTable>[],
    ) {
        const dataTable = getProjectionDataMetadata(projectionType);

        const ids = this.getTargetIds(projectionType, events);

        const data = await this.dataStore.findMany(dataTable, ids);

        this.applyEvents(projection, data, events);

        return await db.transaction(async (tx) => {
            await this.dataStore.storeMany(dataTable, data, { tx });

            return await this.updateTokenPosition(
                tx,
                projectionType,
                events[events.length - 1].sequenceId,
            );
        });
    }

    private applyEvents(
        projection: any,
        data: any[],
        events: InferSelectModel<typeof eventsTable>[],
    ) {
        for (const event of events) {
            const targetEventHandler = Reflect.getMetadata(
                event.type,
                projection.constructor,
            );

            if (!targetEventHandler) {
                throw new ProjectionUnsupportedEventError(
                    projection.constructor.name,
                    event.type,
                );
            }

            const targetId = targetEventHandler.id(event.data);

            const existingDataIndex: any = data.findIndex(
                (d) => d.id === targetId,
            );

            const updatedData = projection[targetEventHandler.propertyKey](
                event.data,
                data[existingDataIndex],
            );

            if (existingDataIndex !== -1) {
                data[existingDataIndex] = updatedData;
            } else {
                data.push(updatedData);
            }
        }
    }

    private getTargetIds(
        projectionType: Type,
        events: InferSelectModel<typeof eventsTable>[],
    ): string[] {
        const ids: Set<string> = new Set<string>();

        for (const event of events) {
            const targetEventHandler = Reflect.getMetadata(
                event.type,
                projectionType,
            );

            if (!targetEventHandler) {
                throw new ProjectionUnsupportedEventError(
                    projectionType.name,
                    event.type,
                );
            }

            const id = targetEventHandler.id(event.data);

            if (typeof id !== 'string') {
                throw new ProjectionInvalidIdError();
            }

            ids.add(id);
        }

        return Array.from(ids);
    }
}
