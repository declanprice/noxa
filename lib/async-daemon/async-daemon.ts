import { Pool } from 'pg';
import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { DataStore, InjectDatabase } from '../store';
import { BusRelay, InjectBusRelay } from '../bus';
import { EventPoller } from './event.poller';
import { OutboxPoller } from './outbox-poller';

@Injectable()
export class AsyncDaemon {
    constructor(
        @InjectDatabase() private readonly pool: Pool,
        @InjectBusRelay() private readonly busRelay: BusRelay,
        private readonly documentStore: DataStore,
        private readonly moduleRef: ModuleRef,
    ) {}

    logger = new Logger(AsyncDaemon.name);

    async start(projections: {
        document: Type[];
        event: Type[];
    }): Promise<void> {
        this.logger.log('starting async daemon.');

        new OutboxPoller(this.pool, this.busRelay).start().then();

        projections.document.forEach((projection) => {
            new EventPoller(this.pool, this.moduleRef, this.documentStore)
                .start(projection, 'document')
                .then();
        });

        projections.event.forEach((projection) => {
            new EventPoller(this.pool, this.moduleRef, this.documentStore)
                .start(projection, 'event')
                .then();
        });
    }
}
