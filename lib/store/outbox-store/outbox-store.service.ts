import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool, PoolClient } from 'pg';
import { Command, Event } from '../../handlers';
import { Config, InjectConfig } from '../../config';
import { InjectStoreConnection } from '../store-connection.token';

@Injectable()
export class OutboxStore {
  constructor(
    @InjectStoreConnection()
    private readonly connection: PoolClient | Pool,
    @InjectConfig()
    private readonly config: Config,
  ) {}

  async publishCommand(
    command: Command,
    options?: { toContext?: string; tenantId?: string },
  ): Promise<void> {
    const { toContext, tenantId } = options || {};

    await this.connection.query({
      text: `insert into noxa_outbox (
            "id",
            "toBus",
            "fromContext",
            "toContext",
            "tenantId",
            "timestamp",
            "data",
            "type",
            "published",
            "publishedTimestamp"
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
  }

  async publishEvent(
    event: Event,
    options?: { tenantId?: string; timestamp?: string },
  ): Promise<string> {
    const { tenantId, timestamp } = options || {};

    const messageId = randomUUID();

    await this.connection.query({
      text: `insert into noxa_outbox (
            "id",
            "toBus",
            "fromContext",
            "toContext",
            "tenantId",
            "timestamp",
            "data",
            "type",
            "published",
            "publishedTimestamp"
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       `,
      values: [
        messageId,
        'event',
        this.config.context,
        null,
        tenantId ? tenantId : 'default',
        timestamp ? timestamp : new Date().toISOString(),
        event,
        event.constructor.name,
        false,
        null,
      ],
    });

    return messageId;
  }

  async unpublishEvent(messageId: string) {
    await this.connection.query({
      text: `DELETE FROM noxa_outbox WHERE id = $1`,
      values: [messageId],
    });
  }

  static async createResources(connection: PoolClient) {
    await connection.query({
      text: `
        CREATE TABLE IF NOT EXISTS noxa_outbox (
        "id" uuid not null constraint noxa_outbox_pk primary key,
        "toBus" varchar(500) not null,
        "fromContext" varchar(500) not null,
        "toContext" varchar(500) null,
        "tenantId" varchar not null,
        "timestamp" timestamp with time zone default now() not null,
        "data" jsonb not null,
        "type" varchar(500) not null,
        "published" boolean default false not null,
        "publishedTimestamp" timestamp with time zone null
    )`,
      values: [],
    });
  }
}
