import { randomUUID } from 'crypto';
import { PoolClient } from 'pg';
import { Injectable, Optional } from '@nestjs/common';

@Injectable()
export class OutboxStore {
  constructor(@Optional() private readonly client?: PoolClient) {
    console.log('outbox multi-store-session was created');
  }

  async publishCommand() {
    await this.client?.query({
      text: `insert into noxa_streams (id, type, version) values ($1, $2, $3)`,
      values: [randomUUID(), 'test', 1],
    });
  }

  async publishEvent() {
    await this.client?.query({
      text: `insert into noxa_streams (id, type, version) values ($1, $2, $3)`,
      values: [randomUUID(), 'test', 1],
    });
  }
}
