import { Logger } from '@nestjs/common';
import { BusRelay } from '../bus';
import { DatabaseClient } from '../store/database-client.service';
import { Prisma } from '@prisma/client';

export class OutboxPoller {
    constructor(
        private readonly db: DatabaseClient,
        private busRelay: BusRelay,
    ) {}

    logger = new Logger(OutboxPoller.name);

    slowPollTimeInMs = 500;

    fastPollTimeInMs = 250;

    async start(): Promise<any> {
        const messages = await this.db.outbox.findMany({
            where: {
                published: false,
                timestamp: {
                    lte: new Date().toISOString(),
                },
            },
            orderBy: {
                timestamp: Prisma.SortOrder.asc,
            },
        });

        if (messages.length === 0) {
            this.logger.log(
                `no outbox messages found, checking for more in ${
                    this.slowPollTimeInMs / 1000
                } seconds.`,
            );

            return setTimeout(() => {
                this.start().then();
            }, this.slowPollTimeInMs);
        }

        for (const message of messages) {
            if (message.bus === 'command') {
                await this.busRelay.sendCommand({
                    type: message.type,
                    timestamp: message.timestamp.toISOString(),
                    data: message.data,
                });
            }

            if (message.bus === 'event') {
                await this.busRelay.sendEvent({
                    type: message.type,
                    timestamp: message.timestamp.toISOString(),
                    data: message.data,
                });
            }

            await this.db.outbox.update({
                where: {
                    id: message.id,
                },
                data: {
                    published: true,
                    publishedTimestamp: new Date().toISOString(),
                },
            });
        }

        this.logger.log(
            `successfully published ${messages.length} outbox messages, checking for more now.`,
        );

        return setTimeout(() => {
            this.start().then();
        }, this.fastPollTimeInMs);
    }
}
