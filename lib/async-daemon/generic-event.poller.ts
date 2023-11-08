import { Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, eq, gt, inArray } from 'drizzle-orm';
import {
    eventsTable,
    SelectEvent,
    SelectToken,
    tokensTable,
} from '../schema/schema';

export abstract class GenericEventPoller {
    logger = new Logger(GenericEventPoller.name);

    pollTimeInMs = 500;

    constructor(protected readonly db: NodePgDatabase<any>) {}

    abstract handleEventBatch(events: SelectEvent[]): Promise<SelectToken>;

    async start(eventTypes: string[] | null) {
        const token = await this.getTrackingToken('HighWaterMark');

        this.pollEvents(eventTypes, token).then();
    }

    async pollEvents(eventTypes: string[] | null, trackingToken: SelectToken) {
        const events = await this.db
            .select()
            .from(eventsTable)
            .where(
                and(
                    eventTypes
                        ? inArray(eventsTable.type, eventTypes)
                        : undefined,
                    gt(eventsTable.sequenceId, trackingToken.lastSequenceId),
                ),
            )
            .orderBy(asc(eventsTable.sequenceId))
            .limit(25000);

        if (events.length === 0) {
            return setTimeout(() => {
                this.pollEvents(eventTypes, trackingToken).then();
            }, this.pollTimeInMs);
        }

        this.logger.log(
            `${events.length} events available, processing batch now.`,
        );

        const beforeDate = Date.now();

        const newTrackingToken = await this.handleEventBatch(events);

        this.logger.log(
            `successfully processed batch of ${events} in ${Math.abs(
                (beforeDate - Date.now()) / 1000,
            )} seconds, checking for more events in 1 second.`,
        );

        return setTimeout(() => {
            this.pollEvents(eventTypes, newTrackingToken).then();
        }, this.pollTimeInMs);
    }

    async getTrackingToken(name: string): Promise<SelectToken> {
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
