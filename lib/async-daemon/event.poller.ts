import { Logger, Type } from '@nestjs/common';
import { events, Prisma, tokens } from '@prisma/client';
import { ModuleRef } from '@nestjs/core';
import {
    getProjectionHandlerTypes,
    getProjectionOption,
    ProjectionOptions,
} from '../handlers/projection/projection.decorators';
import { HighWaterMarkAgent } from './high-water-mark-agent';
import { DatabaseClient } from '../store/database-client.service';
import { handleProjection } from '../handlers/projection/handle-projection';

export class EventPoller {
    logger = new Logger(EventPoller.name);

    pollTimeInMs = 500;

    constructor(
        private readonly db: DatabaseClient,
        private readonly moduleRef: ModuleRef,
    ) {}

    async start(projectionType: Type) {
        const projection = this.moduleRef.get(projectionType, {
            strict: false,
        });

        const projectionOptions = getProjectionOption(projectionType);

        const eventTypes = getProjectionHandlerTypes(projectionType);

        const trackingToken = await this.getTrackingToken(projectionType.name);

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
        const events = await this.getEvents(trackingToken);

        if (events.length === 0) {
            this.logger.log(
                `no new events available, checking again in ${this.pollTimeInMs / 1000} seconds.`,
            );

            return setTimeout(() => {
                this.pollEvents(
                    projection,
                    projectionOptions,
                    eventTypes,
                    trackingToken,
                ).then();
            }, this.pollTimeInMs);
        }

        this.logger.log(
            `${events.length} events available, processing batch now.`,
        );

        const beforeDate = Date.now();

        const updatedTrackingToken = await handleProjection(
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
        }, 0);
    }

    async getEvents(trackingToken: tokens): Promise<events[]> {
        return this.db.$queryRawUnsafe(`select *
            from events e
            where (e."transactionId"::xid8, e.id) > ('${trackingToken.lastTransactionId}'::xid8, ${trackingToken.lastEventId})
            and e."transactionId"::xid8 < pg_snapshot_xmin(pg_current_snapshot())
            order by e.id asc
            limit 1000
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
