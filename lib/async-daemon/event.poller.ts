import { Logger, Type } from '@nestjs/common';
import { Prisma, tokens } from '@prisma/client';
import { ModuleRef } from '@nestjs/core';
import {
    getProjectionHandlerTypes,
    getProjectionOption,
} from '../handlers/projection/projection.decorators';
import { HighWaterMarkAgent } from './high-water-mark-agent';
import { DatabaseClient } from '../store/database-client.service';
import { HandleProjection } from '../handlers/projection/handle-projection';

export class EventPoller {
    logger = new Logger(EventPoller.name);

    pollTimeInMs = 500;

    constructor(
        private readonly db: DatabaseClient,
        private readonly moduleRef: ModuleRef,
        private readonly highWaterMarkAgent: HighWaterMarkAgent,
    ) {}

    async start(projectionType: Type) {
        const options = getProjectionOption(projectionType);

        const eventTypes = getProjectionHandlerTypes(projectionType);

        const token = await this.getProjectionToken(projectionType.name);

        this.pollEvents(projectionType, Array.from(eventTypes), token).then();
    }

    async pollEvents(
        projectionType: Type,
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
            take: 25000,
        });

        if (events.length === 0) {
            return setTimeout(() => {
                this.pollEvents(projectionType, eventTypes, token).then();
            }, this.pollTimeInMs);
        }

        this.logger.log(
            `${events.length} events available, processing batch now.`,
        );

        const handleProjection = new HandleProjection();

        const projection = this.moduleRef.get(projectionType, {
            strict: false,
        });

        const beforeDate = Date.now();

        const updatedToken = await handleProjection.handleEvents(
            this.db,
            projection,
            projectionType.name,
            events,
        );

        this.logger.log(
            `successfully processed batch of ${events.length} in ${Math.abs(
                (beforeDate - Date.now()) / 1000,
            )} seconds, checking for more events in 1 second.`,
        );

        return setTimeout(() => {
            this.pollEvents(projectionType, eventTypes, updatedToken).then();
        }, this.pollTimeInMs);
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
