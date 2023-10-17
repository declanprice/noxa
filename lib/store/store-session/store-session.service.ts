import { Pool } from 'pg';
import { Injectable } from '@nestjs/common';
import { DocumentStore } from '../document-store/document-store.service';
import { EventStore } from '../event-store/event-store.service';
import { OutboxStore } from '../outbox-store/outbox-store.service';
import { InjectStoreConnection } from '../store-connection.token';
import { Config, InjectConfig } from '../../config';

@Injectable()
export class StoreSession {
  constructor(
    @InjectStoreConnection() private readonly pool: Pool,
    @InjectConfig() private readonly config: Config,
  ) {}

  async start() {
    const client = await this.pool.connect();

    await client.query('BEGIN');

    const documentStore = new DocumentStore(client);
    const eventStore = new EventStore(client);
    const outboxStore = new OutboxStore(client, this.config);

    return {
      document: documentStore,
      event: eventStore,
      outbox: outboxStore,
      commit: async () => {
        try {
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
      rollback: async () => {
        try {
          await client.query('ROLLBACK');
        } catch (error) {
          throw error;
        } finally {
          client.release();
        }
      },
    };
  }
}
