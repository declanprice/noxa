import { randomUUID } from 'crypto';
import { PoolClient } from 'pg';
import { Injectable, Optional } from '@nestjs/common';

@Injectable()
export class EventStore {
  constructor(@Optional() private readonly client?: PoolClient) {
    console.log('event multi-store-session was created');
  }

  async startStream() {
    await this.client?.query({
      text: `insert into noxa_streams (id, type, version) values ($1, $2, $3)`,
      values: [randomUUID(), 'test', 1],
    });
  }

  hydrateStream() {}

  getStream() {}
}
