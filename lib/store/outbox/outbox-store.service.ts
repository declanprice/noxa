import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Command, Event } from '../../handlers';
import { InjectDatabase } from '../database.token';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTransaction } from 'drizzle-orm/pg-core/session';
import { outbox } from '../../schema/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class OutboxStore {
    constructor(
        @InjectDatabase()
        private readonly db: NodePgDatabase<any>,
    ) {}

    async publishMessage(
        bus: 'command' | 'event',
        type: string,
        data: any,
        options?: { timestamp?: string; tx?: PgTransaction<any> },
    ): Promise<void> {
        const { timestamp, tx } = options || {};

        const db = tx ?? this.db;

        await db.insert(outbox).values({
            id: randomUUID(),
            toBus: bus,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            data,
            type,
            published: false,
            publishedTimestamp: null,
        });
    }

    async publishCommand(
        command: Command,
        options?: { timestamp?: string; tx?: PgTransaction<any> },
    ): Promise<string> {
        const messageId = randomUUID();

        const { timestamp, tx } = options || {};

        const db = tx ?? this.db;

        await db.insert(outbox).values({
            id: randomUUID(),
            toBus: 'command',
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            data: command,
            type: command.constructor.name,
            published: false,
            publishedTimestamp: null,
        });

        return messageId;
    }

    async publishEvent(
        event: Event,
        options?: { timestamp?: string; tx?: PgTransaction<any> },
    ): Promise<string> {
        const messageId = randomUUID();

        const { timestamp, tx } = options || {};

        const db = tx ?? this.db;

        await db.insert(outbox).values({
            id: randomUUID(),
            toBus: 'event',
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            data: event,
            type: event.constructor.name,
            published: false,
            publishedTimestamp: null,
        });

        return messageId;
    }

    async unpublish(messageId: string, options?: { tx?: PgTransaction<any> }) {
        const { tx } = options || {};

        const db = tx ?? this.db;

        await db.delete(outbox).where(eq(outbox.id, messageId));
    }
}
