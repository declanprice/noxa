import { Injectable } from '@nestjs/common';
import { DocumentStore } from '../document-store/document-store.service';
import { EventStore } from '../event-store/event-store.service';
import { OutboxStore } from '../outbox-store/outbox-store.service';
import { Pool } from 'pg';
import { InjectStoreConnectionPool } from '../store-connection-pool.token';

@Injectable()
export class MultiStoreSession {
  constructor(@InjectStoreConnectionPool() private readonly pool: Pool) {}

  async start() {
    const client = await this.pool.connect();

    await client.query('BEGIN');

    const documentStore = new DocumentStore(client);
    const eventStore = new EventStore(client);
    const outboxStore = new OutboxStore(client);

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
    };
  }
}
