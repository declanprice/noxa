import { Logger, Type } from '@nestjs/common';
import { events, Prisma, tokens } from '@prisma/client';
import { ModuleRef } from '@nestjs/core';
import {
    getProjectionHandlerTypes,
    getProjectionOption,
    ProjectionOptions,
} from '../handlers/projection/projection.decorators';
import { DatabaseClient } from '../store/database-client.service';
import { handleProjection } from '../handlers/projection/handle-projection';

export class TransactionalEventPoller {
    logger: Logger;

    slowPollTimeInMs = 500;

    fastPollTimeInMs = 250;

    constructor(
        private readonly db: DatabaseClient,
        private readonly moduleRef: ModuleRef,
        private readonly projectionType: Type,
    ) {
        this.logger = new Logger(projectionType.name);
    }

    async start() {
        const projection = this.moduleRef.get(this.projectionType, {
            strict: false,
        });

        const projectionOptions = getProjectionOption(this.projectionType);

        const eventTypes = getProjectionHandlerTypes(this.projectionType);

        const trackingToken = await this.getTrackingToken(
            this.projectionType.name,
        );

        this.pollEvents(
            projection,
            projectionOptions,
            Array.from(eventTypes),
            trackingToken,
        ).then();
    }

    async pollEvents(
        projection: Type,
        projectionOptions: ProjectionOptions,
        eventTypes: string[],
        trackingToken: tokens,
    ) {
        const events = await this.getEvents(
            projectionOptions?.batchSize || 100,
            eventTypes,
            trackingToken,
        );

        if (events.length === 0) {
            this.logger.log(
                `no new events available, checking again in ${this.slowPollTimeInMs / 1000} seconds.`,
            );

            return setTimeout(() => {
                this.pollEvents(
                    projection,
                    projectionOptions,
                    eventTypes,
                    trackingToken,
                ).then();
            }, this.slowPollTimeInMs);
        }

        this.logger.log(
            `${events.length} events available, processing batch now.`,
        );

        const beforeDate = Date.now();

        let updatedTrackingToken = await handleProjection(
            this.db,
            projection,
            events,
        );

        this.logger.log(
            `successfully processed batch of ${events.length} in ${Math.abs(
                (beforeDate - Date.now()) / 1000,
            )} seconds, checking for more now.`,
        );

        return setTimeout(() => {
            this.pollEvents(
                projection,
                projectionOptions,
                eventTypes,
                updatedTrackingToken,
            ).then();
        }, this.fastPollTimeInMs);
    }

    async getEvents(
        batchSize: number,
        eventTypes: string[],
        trackingToken: tokens,
    ): Promise<events[]> {
        return this.db.$queryRaw(Prisma.sql`
            SELECT * FROM events e WHERE
            (
              (e."transactionId"::xid8 = ${trackingToken.lastTransactionId}::xid8 AND e.id > ${trackingToken.lastEventId})
              OR
              (e."transactionId"::xid8 > ${trackingToken.lastTransactionId}::xid8)
            )
            AND e."transactionId"::xid8 < pg_snapshot_xmin(pg_current_snapshot())
            AND e.type in (${Prisma.join(eventTypes)})
            ORDER BY
                e."transactionId" asc,
                e.id asc
            LIMIT ${batchSize};
        `);
    }

    async getTrackingToken(name: string): Promise<tokens> {
        const token = await this.db.tokens.findUnique({
            where: {
                name,
            },
        });

        if (token) {
            return token;
        }

        return this.db.tokens.create({
            data: {
                name,
                lastEventId: 0,
                lastTransactionId: '0',
                timestamp: new Date().toISOString(),
            },
        });
    }
}
