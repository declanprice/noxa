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

    async publishMessage(
        bus: 'command' | 'event',
        type: string,
        data: any,
        options?: { timestamp?: string },
    ): Promise<void> {
        const { timestamp } = options || {};

        await this.connection.query({
            text: `insert into noxa_outbox (
            "id",
            "toBus",
            "timestamp",
            "data",
            "type",
            "published",
            "publishedTimestamp"
        ) values ($1, $2, $3, $4, $5, $6, $7)
       `,
            values: [
                randomUUID(),
                bus,
                timestamp ? timestamp : new Date().toISOString(),
                data,
                type,
                false,
                null,
            ],
        });
    }

    async publishCommand(
        command: Command,
        options?: { timestamp?: string },
    ): Promise<string> {
        const { timestamp } = options || {};

        const messageId = randomUUID();

        await this.connection.query({
            text: `insert into noxa_outbox (
            "id",
            "toBus",
            "timestamp",
            "data",
            "type",
            "published",
            "publishedTimestamp"
        ) values ($1, $2, $3, $4, $5, $6, $7)
       `,
            values: [
                messageId,
                'command',
                timestamp ? timestamp : new Date().toISOString(),
                command,
                command.constructor.name,
                false,
                null,
            ],
        });

        return messageId;
    }

    async publishEvent(
        event: Event,
        options?: { timestamp?: string },
    ): Promise<string> {
        const { timestamp } = options || {};

        const messageId = randomUUID();

        await this.connection.query({
            text: `insert into noxa_outbox (
            "id",
            "toBus",
            "timestamp",
            "data",
            "type",
            "published",
            "publishedTimestamp"
        ) values ($1, $2, $3, $4, $5, $6, $7)
       `,
            values: [
                messageId,
                'event',
                timestamp ? timestamp : new Date().toISOString(),
                event,
                event.constructor.name,
                false,
                null,
            ],
        });

        return messageId;
    }

    async unpublish(messageId: string) {
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
