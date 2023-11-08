import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { DataStore, InjectDatabase } from '../store';
import { BusRelay, InjectBusRelay } from '../bus';
import { EventPoller } from './event.poller';
import { OutboxPoller } from './outbox-poller';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { HighWaterMarkAgent } from './high-water-mark-agent';

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

    async start(projections: { data: Type[]; event: Type[] }): Promise<void> {
        this.logger.log('starting async daemon.');

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
