import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
    DatabaseClient,
    DatabaseTransactionClient,
} from '../database-client.service';

@Injectable()
export class OutboxStore {
    constructor(private db: DatabaseClient) {}

    async message(
        bus: 'command' | 'event',
        type: string,
        data: any,
        options?: { timestamp?: string; tx?: DatabaseTransactionClient },
    ) {
        const { timestamp, tx } = options || {};

        const db = tx ?? this.db;

        return db.outbox.create({
            data: {
                id: randomUUID(),
                bus,
                timestamp: timestamp
                    ? new Date(timestamp).toISOString()
                    : new Date().toISOString(),
                data,
                type,
                published: false,
            },
        });
    }

    async command(
        command: any,
        options?: { timestamp?: string; tx?: DatabaseTransactionClient },
    ) {
        const messageId = randomUUID();

        const { timestamp, tx } = options || {};

        const db = tx ?? this.db;

        return db.outbox.create({
            data: {
                id: messageId,
                bus: 'command',
                timestamp: timestamp
                    ? new Date(timestamp).toISOString()
                    : new Date().toISOString(),
                type: command.constructor.name,
                data: command,
                published: false,
            },
        });
    }

    async event(
        event: any,
        options?: { timestamp?: string; tx?: DatabaseTransactionClient },
    ) {
        const messageId = randomUUID();

        const { timestamp, tx } = options || {};

        const db = tx ?? this.db;

        return db.outbox.create({
            data: {
                id: messageId,
                bus: 'event',
                timestamp: timestamp
                    ? new Date(timestamp).toISOString()
                    : new Date().toISOString(),
                type: event.constructor.name,
                data: event,
                published: false,
            },
        });
    }

    async delete(
        messageId: string,
        options?: { tx?: DatabaseTransactionClient },
    ) {
        const { tx } = options || {};

        const db = tx ?? this.db;

        return db.outbox.delete({ where: { id: messageId } });
    }
}
