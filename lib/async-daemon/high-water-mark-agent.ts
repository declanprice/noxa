import { Injectable, Logger } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { DatabaseClient } from '../store/database-client.service';
import { tokens } from '@prisma/client';
import { v4 } from 'uuid';

const HIGH_WATER_MARK_NAME = 'HighWaterMark';

@Injectable()
export class HighWaterMarkAgent {
    logger = new Logger(HighWaterMarkAgent.name);

    constructor(private readonly db: DatabaseClient) {}

    public highWaterMark: bigint = BigInt(1);

    private slowPollDurationInMs: number = 1000;

    private fastPollDurationInMs: number = 250;

    private staleDurationInSeconds: number = 3;

    async start(): Promise<void> {
        const trackingToken = await this.getTrackingToken();

        this.highWaterMark = trackingToken.lastEventId;

        this.logger.log(`starting at ${this.highWaterMark}`);

        await this.poll(trackingToken);
    }

    async poll(trackingToken: tokens) {
        const latestSequenceId = await this.getLatestEventId();

        // already update to date, just check again in 1 second.
        if (this.highWaterMark === latestSequenceId) {
            return setTimeout(() => {
                this.poll(trackingToken).then();
            }, this.fastPollDurationInMs);
        }

        const gap = await this.checkForGap(trackingToken.lastEventId);

        // no gap, simply update the tracking token and re-poll to check for changes.
        if (gap === null) {
            trackingToken = await this.updateTrackingToken(latestSequenceId);

            this.highWaterMark = trackingToken.lastEventId;

            this.logger.log(
                `updating tracking token to ${trackingToken.lastEventId}`,
            );

            return setTimeout(() => {
                this.poll(trackingToken).then();
            }, this.fastPollDurationInMs);
        }

        // new gap, re-poll in 1 seconds to check if the gap still exists.

        if (
            dayjs(new Date()).diff(gap.timestamp, 'seconds') <=
            this.staleDurationInSeconds
        ) {
            this.logger.log(
                `gap detected, checking again in ${
                    this.slowPollDurationInMs / 1000
                } seconds.`,
            );

            return setTimeout(() => {
                this.poll(trackingToken).then();
            }, this.slowPollDurationInMs);
        }

        const gapId = gap.id + BigInt(1);

        this.logger.log(`inserting tombstone event at ${Number(gapId)}`);

        await this.insertTombstoneEvent(gapId);

        trackingToken = await this.updateTrackingToken(gapId);

        return setTimeout(() => {
            this.poll(trackingToken).then();
        }, 0);
    }

    async checkForGap(
        fromSequenceId: bigint,
    ): Promise<{ id: bigint; timestamp: string } | null> {
        const result: any[] = await this.db.$queryRawUnsafe(`select * from (
           select
               id,
               timestamp,
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
                lastTransactionId: '',
                lastEventId: await this.getLatestEventId(),
                timestamp: new Date().toISOString(),
            },
        });
    }

    async updateTrackingToken(lastEventId: bigint): Promise<tokens> {
        return this.db.tokens.update({
            where: {
                name: HIGH_WATER_MARK_NAME,
            },
            data: {
                lastTransactionId: '',
                lastEventId,
                timestamp: new Date().toISOString(),
            },
        });
    }

    async getLatestEventId(): Promise<bigint> {
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

    async insertTombstoneEvent(gapId: bigint): Promise<void> {
        const streamId = v4();

        const now = new Date().toISOString();

        await this.db.streams.create({
            data: {
                id: streamId,
                isArchived: false,
                type: 'TombstoneStream',
                version: 0,
                snapshot: {},
                snapshotVersion: 0,
                timestamp: now,
                events: {
                    create: {
                        id: gapId,
                        isArchived: false,
                        timestamp: now,
                        type: 'TombstoneEvent',
                        data: {},
                    },
                },
            },
        });
    }
}
