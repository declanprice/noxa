import { Logger, Type } from '@nestjs/common';
import { Prisma, tokens } from '@prisma/client';
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
        private readonly highWaterMarkAgent: HighWaterMarkAgent,
    ) {}

    async start(projectionType: Type) {
        const projection = this.moduleRef.get(projectionType, {
            strict: false,
        });

        const projectionOptions = getProjectionOption(projectionType);

        const eventTypes = getProjectionHandlerTypes(projectionType);

        const token = await this.getProjectionToken(projectionType.name);

        this.pollEvents(
            projection,
            projectionOptions,
            Array.from(eventTypes),
            token,
        ).then();
    }

    async pollEvents(
        projection: Type,
        projectionOptions: ProjectionOptions,
        eventTypes: string[],
        token: tokens,
    ) {
        const events = await this.db.events.findMany({
            where: {
                type: {
                    in: eventTypes,
                },
                id: {
                    gt: Number(token.lastSequenceId).valueOf(),
                    lte: Number(
                        this.highWaterMarkAgent.highWaterMark,
                    ).valueOf(),
                },
            },
            orderBy: {
                id: Prisma.SortOrder.asc,
            },
            take: projectionOptions.batchSize,
        });

        if (events.length === 0) {
            return setTimeout(() => {
                this.pollEvents(
                    projection,
                    projectionOptions,
                    eventTypes,
                    token,
                ).then();
            }, this.pollTimeInMs);
        }

        this.logger.log(
            `${events.length} events available, processing batch now.`,
        );

        const beforeDate = Date.now();

        const updatedToken = await handleProjection(
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
                updatedToken,
            ).then();
        }, 0);
    }

    async getProjectionToken(name: string): Promise<tokens> {
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
                lastSequenceId: -1,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
