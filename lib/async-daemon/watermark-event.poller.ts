import { Logger, Type } from '@nestjs/common';
import { events, Prisma, tokens } from '@prisma/client';
import { ModuleRef } from '@nestjs/core';

import { DatabaseClient } from '../store/database-client.service';
import { handleProjection } from '../handlers/projection/handle-projection';
import { HighWaterMarkAgent } from './high-water-mark-agent';
import {
    getProjectionHandlerTypes,
    getProjectionOptions,
    ProjectionOptions,
} from '../handlers/projection/projection.decorators';

export class WatermarkEventPoller {
    logger: Logger;

    slowPollTimeInMs = 500;

    fastPollTimeInMs = 250;

    constructor(
        private readonly db: DatabaseClient,
        private readonly moduleRef: ModuleRef,
        private readonly waterMarkAgent: HighWaterMarkAgent,
        private readonly projection: Type,
    ) {
        this.logger = new Logger(projection.name);
    }

    async start() {
        const projection = this.moduleRef.get(this.projection, {
            strict: false,
        });

        const projectionOptions = getProjectionOptions(this.projection);

        const eventTypes = getProjectionHandlerTypes(this.projection);

        const trackingToken = await this.getTrackingToken(this.projection.name);

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
            this.waterMarkAgent.highWaterMark,
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
        watermark: bigint,
        eventTypes: string[],
        trackingToken: tokens,
    ): Promise<events[]> {
        return this.db.events.findMany({
            where: {
                id: {
                    gt: trackingToken.lastEventId,
                    lte: watermark,
                },
                type: {
                    in: eventTypes,
                },
            },
            orderBy: {
                id: Prisma.SortOrder.asc,
            },
            take: batchSize,
        });
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
