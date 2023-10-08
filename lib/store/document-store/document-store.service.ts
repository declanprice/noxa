import { randomUUID } from 'crypto';
import { PoolClient } from 'pg';
import { Injectable, Optional } from '@nestjs/common';

@Injectable()
export class DocumentStore {
  constructor(@Optional() private readonly client?: PoolClient) {
    console.log('document multi-store-session was created');
  }

  get() {}

  async store() {
    await this.client?.query({
      text: `insert into noxa_streams (id, type, version) values ($1, $2, $3)`,
      values: [randomUUID(), 'test', 1],
    });
  }

  update() {}

  delete() {}

  query() {}
}
