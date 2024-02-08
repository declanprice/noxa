import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Client } from 'pg';
import { EventPoller } from './event.poller';
import { OutboxPoller } from './outbox-poller';
import { HighWaterMarkAgent } from './high-water-mark-agent';
import { BusRelay, InjectBusRelay } from '../bus';
import { DatabaseClient } from '../store/database-client.service';
import { HandleProjection } from '../handlers/projection/handle-projection';

@Injectable()
export class AsyncDaemon {
    constructor(
        private readonly db: DatabaseClient,
        @InjectBusRelay() private readonly busRelay: BusRelay,
        private readonly moduleRef: ModuleRef,
        private readonly highWaterMarkAgent: HighWaterMarkAgent,
    ) {}

    logger = new Logger(AsyncDaemon.name);

    async start(projections: Type[]) {
        // needs singular client to keep the connection open

        this.logger.log('trying to obtain advisory lock.');

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
        });

        await client.connect();

        const result = await client.query(`SELECT pg_try_advisory_lock(4545)`);

        if (
            result.rows.length &&
            result.rows[0].pg_try_advisory_lock === false
        ) {
            this.logger.log(
                'lock is already claimed, checking again in 5 seconds',
            );

            return setInterval(() => {
                this.start(projections).then();
            }, 5000);
        }

        await this.startPollers(projections);

        this.logger.log('lock obtained, async daemon has started.');
    }

    async startPollers(projections: Type[]) {
        await this.highWaterMarkAgent.start();

        new OutboxPoller(this.db, this.busRelay).start().then();

        projections.forEach((projection) => {
            new EventPoller(this.db, this.moduleRef, this.highWaterMarkAgent)
                .start(projection)
                .then();
        });
    }
}
