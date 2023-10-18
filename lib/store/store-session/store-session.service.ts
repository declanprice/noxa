import { Pool } from 'pg';
import { Injectable } from '@nestjs/common';
import { DocumentStore } from '../document-store/document-store.service';
import { EventStore } from '../event-store/event-store.service';
import { OutboxStore } from '../outbox-store/outbox-store.service';
import { InjectStoreConnection } from '../store-connection.token';
import { Config, InjectConfig } from '../../config';

export type Session = {
  document: DocumentStore;
  event: EventStore;
  outbox: OutboxStore;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  release: () => void;
};

@Injectable()
export class StoreSession {
  constructor(
    @InjectStoreConnection() private readonly pool: Pool,
    @InjectConfig() private readonly config: Config,
  ) {}

  async start(): Promise<Session> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const documentStore = new DocumentStore(client);
      const eventStore = new EventStore(client);
      const outboxStore = new OutboxStore(client, this.config);

      return {
        document: documentStore,
        event: eventStore,
        outbox: outboxStore,
        commit: async () => {
          await client.query('COMMIT');
        },
        rollback: async () => {
          await client.query('ROLLBACK');
        },
        release: async () => {
          client.release();
        },
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }

      throw error;
    }
  }
}
