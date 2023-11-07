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
import { and, asc, eq, gt, inArray, InferSelectModel } from 'drizzle-orm';
import { eventsTable, tokensTable } from '../schema/schema';

export class EventPoller {
    logger = new Logger(EventPoller.name);

    pollTimeInMs = 500;

    constructor(
        private readonly db: NodePgDatabase<any>,
        private readonly moduleRef: ModuleRef,
        private readonly dataStore: DataStore,
    ) {}

    async start(projectionType: Type, type: 'document' | 'event') {
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
        handlerType: 'document' | 'event',
        eventTypes: string[],
        token: InferSelectModel<typeof tokensTable>,
    ) {
        const events = await this.db
            .select()
            .from(eventsTable)
            .where(
                and(
                    inArray(eventsTable.type, eventTypes),
                    gt(eventsTable.sequenceId, token.lastSequenceId),
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
            case 'document':
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
            `successfully processed batch of ${events} in ${Math.abs(
                (beforeDate - Date.now()) / 1000,
            )} seconds., checking for more events in 1 second.`,
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
                timestamp: new Date(),
            })
            .returning();

        return newTokens[0];
    }
}
