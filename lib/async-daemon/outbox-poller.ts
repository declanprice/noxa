import { Logger } from '@nestjs/common';
import { BusRelay } from '../bus';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { outboxTable } from '../schema/schema';
import { and, asc, eq, inArray, lte, sql } from 'drizzle-orm';

export class OutboxPoller {
    constructor(
        private readonly db: NodePgDatabase<any>,
        private busRelay: BusRelay,
    ) {}

    logger = new Logger(OutboxPoller.name);

    pollTimeInMs = 500;

    async start(): Promise<any> {
        const messages = await this.db
            .select()
            .from(outboxTable)
            .where(
                and(
                    eq(outboxTable.published, false),
                    lte(outboxTable.timestamp, sql`now()`),
                ),
            )
            .orderBy(asc(outboxTable.timestamp));

        if (messages.length === 0) {
            return setTimeout(() => {
                this.start().then();
            }, this.pollTimeInMs);
        }

        let messageIds: string[] = [];

        for (const message of messages) {
            if (message.toBus === 'command') {
                await this.busRelay.sendCommand({
                    type: message.type,
                    timestamp: message.timestamp,
                    data: message.data,
                });
            }

            if (message.toBus === 'event') {
                await this.busRelay.sendEvent({
                    type: message.type,
                    timestamp: message.timestamp,
                    data: message.data,
                });
            }

            messageIds.push(message.id);
        }

        await this.db
            .update(outboxTable)
            .set({
                published: true,
                publishedTimestamp: sql`now()`,
            })
            .where(inArray(outboxTable.id, messageIds));

        this.logger.log(
            `successfully published ${messages.length} messages, checking for more in 1 second.`,
        );

        return setTimeout(() => {
            this.start().then();
        }, 0);
    }
}
