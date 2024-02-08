import { Injectable, Logger } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { DatabaseClient } from '../store/database-client.service';
import { tokens } from '@prisma/client';
const HIGH_WATER_MARK_NAME = 'HighWaterMark';

@Injectable()
export class HighWaterMarkAgent {
    logger = new Logger(HighWaterMarkAgent.name);

    constructor(private readonly db: DatabaseClient) {}

    public highWaterMark: bigint = BigInt(1);

    private slowPollDurationInMs: number = 1000;

    private fastPollDurationInMs: number = 500;

    private staleDurationInSeconds: number = 3;

    async start(): Promise<void> {
        const trackingToken = await this.getTrackingToken();

        this.highWaterMark = trackingToken.lastSequenceId;

        this.logger.log(`HighWaterMark starting at ${this.highWaterMark}`);

        await this.poll(trackingToken);
    }

    async poll(trackingToken: tokens) {
        const latestSequenceId = await this.getLatestSequenceId();

        // already update to date, just check again in 1 second.
        if (this.highWaterMark === latestSequenceId) {
            return setTimeout(() => {
                this.poll(trackingToken).then();
            }, this.fastPollDurationInMs);
        }

        const gap = await this.checkForGap(trackingToken.lastSequenceId);

        // no gap, simply update the tracking token and re-poll to check for changes.
        if (gap === null) {
            trackingToken = await this.updateTrackingToken(latestSequenceId);

            this.highWaterMark = trackingToken.lastSequenceId;

            this.logger.log(
                `no gaps detected, updating the HighWaterMark to the latest available sequenceId ${latestSequenceId}`,
            );

            return setTimeout(() => {
                this.poll(trackingToken).then();
            }, this.fastPollDurationInMs);
        }

        // new gap, re-poll in 1 seconds to check if the gap still exists.
        if (
            dayjs(gap.timestamp).diff(new Date(), 'seconds') >=
            this.staleDurationInSeconds
        ) {
            this.logger.log(
                `new gap detected, checking again in ${
                    this.slowPollDurationInMs / 1000
                } seconds.`,
            );

            return setTimeout(() => {
                this.poll(trackingToken).then();
            }, this.slowPollDurationInMs);
        }

        // stale gap found, it has existed longer than the configured stale duration (default : 3 seconds), assume event has been rejected.
        this.logger.log(
            `stale gap detected between ${gap.lastSequenceId} and ${
                gap.lastSequenceId + BigInt(2)
            }, updating tracking token latestSequenceId to ${
                gap.lastSequenceId + BigInt(1)
            }`,
        );

        trackingToken = await this.updateTrackingToken(
            gap.lastSequenceId + BigInt(1),
        );

        // the next poll iteration should find no gaps and update the tracking token.
        return setTimeout(() => {
            this.poll(trackingToken).then();
        }, this.slowPollDurationInMs);
    }

    async checkForGap(fromSequenceId: bigint): Promise<tokens | null> {
        const result: tokens[] = await this.db.$queryRawUnsafe(`select id from (
           select
               id,
               lead(id)
               over (order by id) as no
               from events where id >= ${Number(fromSequenceId)}
          ) ct
            where no is not null
            and no - id > 1
            limit 1;`);

        if (result?.length > 0) {
            return result[0];
        }

        return null;
    }

    async getTrackingToken(): Promise<tokens> {
        const token = await this.db.tokens.findUnique({
            where: {
                name: HIGH_WATER_MARK_NAME,
            },
        });

        if (token) {
            return token;
        }

        return this.db.tokens.create({
            data: {
                name: HIGH_WATER_MARK_NAME,
                lastSequenceId: await this.getLatestSequenceId(),
                timestamp: new Date().toISOString(),
            },
        });
    }

    async updateTrackingToken(lastSequenceId: bigint): Promise<tokens> {
        this.logger.log(
            `HighWaterMark updating tracking token to ${lastSequenceId}`,
        );

        return this.db.tokens.update({
            where: {
                name: HIGH_WATER_MARK_NAME,
            },
            data: {
                lastSequenceId,
                timestamp: new Date().toISOString(),
            },
        });
    }

    async getLatestSequenceId(): Promise<bigint> {
        const result = await this.db.events.aggregate({
            _max: {
                id: true,
            },
        });

        if (result._max.id !== null) {
            return BigInt(result._max.id);
        }

        return BigInt(-1);
    }
}
