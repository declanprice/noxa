import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService, DatabaseTransactionClient } from '../database.service';

@Injectable()
export class OutboxStore {
    constructor(
        private db: DatabaseService
    ) {}

    async message(
        bus: 'command' | 'event',
        type: string,
        data: any,
        options?: { timestamp?: string; tx?: DatabaseTransactionClient }
    ): Promise<void> {
        const { timestamp, tx } = options || {};

        const db = tx ?? this.db;

        await db.outbox.create({
           data: {
               id: randomUUID(),
               bus,
               timestamp: timestamp
                   ? new Date(timestamp).toISOString()
                   : new Date().toISOString(),
               data,
               type,
               published: false
           }
        });
    }

    async command(
        type: string,
        data: any,
        options?: { timestamp?: string; tx?: DatabaseTransactionClient }
    ): Promise<string> {
        const messageId = randomUUID();

        const { timestamp, tx } = options || {};

        const db = tx ?? this.db;

        await db.outbox.create({
            data: {
                id: randomUUID(),
                bus: 'command',
                timestamp: timestamp
                    ? new Date(timestamp).toISOString()
                    : new Date().toISOString(),
                data,
                type,
                published: false
            }
        });

        return messageId;
    }

    async event(
        type: string,
        data: any,
        options?: { timestamp?: string; tx?: DatabaseTransactionClient }
    ): Promise<string> {
        const messageId = randomUUID();

        const { timestamp, tx } = options || {};

        const db = tx ?? this.db;

        await db.outbox.create({
            data: {
                id: randomUUID(),
                bus: 'event',
                timestamp: timestamp
                    ? new Date(timestamp).toISOString()
                    : new Date().toISOString(),
                data,
                type,
                published: false
            }
        });

        return messageId;
    }

    async delete(
        messageId: string,
        options?: { tx?: DatabaseTransactionClient }
    ) {
        const { tx } = options || {};

        const db = tx ?? this.db;

        await db.outbox.delete({where: {id: messageId }})
    }
}
