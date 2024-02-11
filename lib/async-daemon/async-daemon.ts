import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Client } from 'pg';
import { EventPoller } from './event.poller';
import { OutboxPoller } from './outbox-poller';
import { HighWaterMarkAgent } from './high-water-mark-agent';
import { BusRelay, InjectBusRelay } from '../bus';
import { DatabaseClient } from '../store/database-client.service';

@Injectable()
export class AsyncDaemon {
    constructor(
        private readonly db: DatabaseClient,
        @InjectBusRelay() private readonly busRelay: BusRelay,
        private readonly moduleRef: ModuleRef,
        private readonly highWaterMarkAgent: HighWaterMarkAgent,
    ) {}

    logger = new Logger(AsyncDaemon.name);

    client = new Client({
        connectionString:
            'postgres://postgres:postgres@localhost:5432/postgres',
    });

    async start(projections: Type[]) {
        // async-daemon needs its own isolated client without connection pooling so that the connection remains open

        this.logger.log('trying to obtain advisory lock.');

        await this.client.connect();

        const result = await this.client.query(
            `SELECT pg_try_advisory_lock(4545)`,
        );

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
        // await this.highWaterMarkAgent.start();

        // new OutboxPoller(this.db, this.busRelay).start().then();

        projections.forEach((projection) => {
            new EventPoller(this.db, this.moduleRef).start(projection).then();
        });
    }
}
