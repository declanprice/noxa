import { Pool } from 'pg';
import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { InjectStoreConnection } from '../store';
import { BusRelay, InjectBusRelay } from '../bus';
import { EventPoller } from './event.poller';
import { OutboxPoller } from './outbox-poller';

@Injectable()
export class AsyncDaemon {
  constructor(
    @InjectStoreConnection() private readonly pool: Pool,
    @InjectBusRelay() private readonly busRelay: BusRelay,
    private readonly moduleRef: ModuleRef,
  ) {}

  logger = new Logger(AsyncDaemon.name);

  async start(projectionHandlers: Type[]): Promise<void> {
    this.logger.log('starting async daemon.');

    for (const handler of projectionHandlers) {
      new EventPoller(this.pool, this.moduleRef).start(handler).then();
    }

    new OutboxPoller(this.pool, this.busRelay).start().then();
  }
}
