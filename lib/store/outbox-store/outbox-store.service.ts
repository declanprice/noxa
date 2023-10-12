import { randomUUID } from 'crypto';
import { PoolClient } from 'pg';
import { Command, Event } from '../../handlers';
import { Config } from '../../config';

export class OutboxStore {
  constructor(
    private readonly client: PoolClient,
    private readonly config: Config,
  ) {
    console.log('outbox store was created');
  }

  async publishCommand(
    command: Command,
    options?: { toContext?: string; tenantId?: string },
  ): Promise<void> {
    try {
      const { toContext, tenantId } = options || {};

      await this.client.query({
        text: `insert into noxa_outbox (
            id,
            to_bus,
            from_context,
            to_context,
            tenant_id,
            timestamp,
            data,
            type,
            published,
            published_timestamp
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       `,
        values: [
          randomUUID(),
          'command',
          this.config.context,
          toContext ? toContext : this.config.context,
          tenantId ? tenantId : 'default',
          new Date().toISOString(),
          command,
          command.constructor.name,
          false,
          null,
        ],
      });
    } catch (error) {
      await this.client.query('ROLLBACK');
      this.client.release();
      throw error;
    }
  }

  async publishEvent(event: Event, options?: { tenantId?: string }) {
    try {
      const { tenantId } = options || {};

      await this.client.query({
        text: `insert into noxa_outbox (
            id,
            to_bus,
            from_context,
            to_context,
            tenant_id,
            timestamp,
            data,
            type,
            published,
            published_timestamp
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       `,
        values: [
          randomUUID(),
          'event',
          this.config.context,
          null,
          tenantId ? tenantId : 'default',
          new Date().toISOString(),
          event,
          event.constructor.name,
          false,
          null,
        ],
      });
    } catch (error) {
      await this.client.query('ROLLBACK');
      this.client.release();
      throw error;
    }
  }

  static async createResources(client: PoolClient) {
    await client.query({
      text: `
        CREATE TABLE IF NOT EXISTS noxa_outbox (
        id uuid not null,
        to_bus varchar(500) not null,
        from_context varchar(500) not null,
        to_context varchar(500) null,
        tenant_id varchar not null,
        timestamp timestamp with time zone default now() not null,
        data jsonb not null,
        type varchar(500) not null,
        published boolean default false not null,
        published_timestamp timestamp with time zone null
    )`,
      values: [],
    });
  }
}
