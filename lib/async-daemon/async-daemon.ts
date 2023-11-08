import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { EventPoller } from './event.poller';
import { OutboxPoller } from './outbox-poller';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { HighWaterMarkAgent } from './high-water-mark-agent';
import { Client } from 'pg';

import { DataStore, InjectDatabase } from '../store';
import { BusRelay, InjectBusRelay } from '../bus';

@Injectable()
export class AsyncDaemon {
    constructor(
        @InjectDatabase() private readonly db: NodePgDatabase<any>,
        @InjectBusRelay() private readonly busRelay: BusRelay,
        private readonly dataStore: DataStore,
        private readonly moduleRef: ModuleRef,
        private readonly highWaterMarkAgent: HighWaterMarkAgent,
    ) {}

    logger = new Logger(AsyncDaemon.name);

    async start(projections: { data: Type[]; event: Type[] }) {
        // needs singular client to keep the connection open

        this.logger.log('trying to obtain advisory lock.');

        const client = new Client({
            connectionString: 'postgres://postgres:postgres@localhost:5432',
        });

        await client.connect();

        const result = await client.query(`SELECT pg_try_advisory_lock(4545)`);

        console.log(result);

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

    async startPollers(projections: { data: Type[]; event: Type[] }) {
        await this.highWaterMarkAgent.start();

        new OutboxPoller(this.db, this.busRelay).start().then();

        projections.data.forEach((projection) => {
            new EventPoller(
                this.db,
                this.moduleRef,
                this.dataStore,
                this.highWaterMarkAgent,
            )
                .start(projection, 'document')
                .then();
        });

        projections.event.forEach((projection) => {
            new EventPoller(
                this.db,
                this.moduleRef,
                this.dataStore,
                this.highWaterMarkAgent,
            )
                .start(projection, 'event')
                .then();
        });
    }
}
