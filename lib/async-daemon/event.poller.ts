import { Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
    getProjectionEventTypesMetadata,
    getProjectionOptionMetadata,
} from '../handlers/projection/projection.decorators';
import { DataProjectionHandler } from '../handlers/projection/handlers/data-projection-handler';
import { EventProjectionHandler } from '../handlers/projection/handlers/event-projection-handler';
import { DataStore } from '../store';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
    and,
    asc,
    between,
    eq,
    gt,
    inArray,
    InferSelectModel,
    lt,
    lte,
} from 'drizzle-orm';
import { eventsTable, tokensTable } from '../schema/schema';
import { HighWaterMarkAgent } from './high-water-mark-agent';

export class EventPoller {
    logger = new Logger(EventPoller.name);

    pollTimeInMs = 500;

    constructor(
        private readonly db: NodePgDatabase<any>,
        private readonly moduleRef: ModuleRef,
        private readonly dataStore: DataStore,
        private readonly highWaterMarkAgent: HighWaterMarkAgent,
    ) {}

    async start(projectionType: Type, type: 'data' | 'event') {
        const options = getProjectionOptionMetadata(projectionType);

        const eventTypes = getProjectionEventTypesMetadata(projectionType);

        const token = await this.getProjectionToken(projectionType.name);

        this.pollEvents(
            projectionType,
            type,
            Array.from(eventTypes),
            token,
        ).then();
    }

    async pollEvents(
        projectionType: Type,
        handlerType: 'data' | 'event',
        eventTypes: string[],
        token: InferSelectModel<typeof tokensTable>,
    ) {
        const events = await this.db
            .select()
            .from(eventsTable)
            .where(
                and(
                    inArray(eventsTable.type, eventTypes),
                    and(
                        gt(eventsTable.sequenceId, token.lastSequenceId),
                        lte(
                            eventsTable.sequenceId,
                            this.highWaterMarkAgent.highWaterMark,
                        ),
                    ),
                ),
            )
            .orderBy(asc(eventsTable.sequenceId))
            .limit(25000);

        if (events.length === 0) {
            return setTimeout(() => {
                this.pollEvents(
                    projectionType,
                    handlerType,
                    eventTypes,
                    token,
                ).then();
            }, this.pollTimeInMs);
        }

        this.logger.log(
            `${events.length} events available, processing batch now.`,
        );

        let updatedToken: InferSelectModel<typeof tokensTable>;

        const beforeDate = Date.now();

        const documentProjectionHandler = new DataProjectionHandler(
            this.dataStore,
        );

        const eventProjectionHandler = new EventProjectionHandler();

        const projection = this.moduleRef.get(projectionType, {
            strict: false,
        });

        switch (handlerType) {
            case 'data':
                updatedToken = await documentProjectionHandler.handleEvents(
                    this.db,
                    projection,
                    projectionType,
                    events,
                );
                break;
            case 'event':
                updatedToken = await eventProjectionHandler.handleEvents(
                    this.db,
                    projection,
                    projectionType,
                    events,
                );
                break;
            default:
                this.logger.log(
                    'Projection type must be either [Document] or [Generic]',
                );
                break;
        }

        this.logger.log(
            `successfully processed batch of ${events.length} in ${Math.abs(
                (beforeDate - Date.now()) / 1000,
            )} seconds, checking for more events in 1 second.`,
        );

        return setTimeout(() => {
            this.pollEvents(
                projectionType,
                handlerType,
                eventTypes,
                updatedToken,
            ).then();
        }, this.pollTimeInMs);
    }

    async getProjectionToken(
        name: string,
    ): Promise<InferSelectModel<typeof tokensTable>> {
        const tokens = await this.db
            .select()
            .from(tokensTable)
            .where(eq(tokensTable.name, name));

        if (tokens.length) {
            return tokens[0];
        }

        const newTokens = await this.db
            .insert(tokensTable)
            .values({
                name,
                lastSequenceId: -1,
                timestamp: new Date().toISOString(),
            })
            .returning();

        return newTokens[0];
    }
}
