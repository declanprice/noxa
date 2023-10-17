import { Pool } from 'pg';
import { Injectable, Logger, Type } from '@nestjs/common';
import { InjectStoreConnectionPool } from '../store';
import { OutboxPoller } from './outbox-poller';
import { BusRelay, InjectBusRelay } from '../bus';
import { EventPoller } from './event.poller';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class AsyncDaemon {
  constructor(
    @InjectStoreConnectionPool() private readonly pool: Pool,
    @InjectBusRelay() private readonly busRelay: BusRelay,
    private readonly moduleRef: ModuleRef,
  ) {}

  logger = new Logger(AsyncDaemon.name);

  async start(projectionHandlers: Type[]): Promise<void> {
    this.logger.log('starting async daemon.');

    for (const handler of projectionHandlers) {
      const poller = new EventPoller(this.pool, this.moduleRef);
      poller.start(handler).then();
    }

    // const outboxPoller = new OutboxPoller(this.pool, this.busRelay);

    // outboxPoller.start().then();
  }
}
