import { Injectable } from '@nestjs/common';
import { DataStore } from '../data/data-store.service';
import { EventStore } from '../event/event-store.service';
import { OutboxStore } from '../outbox/outbox-store.service';
import { InjectDatabase } from '../database.token';
import { Config, InjectConfig } from '../../config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTransaction } from 'drizzle-orm/pg-core/session';

export type Session = {
    data: DataStore;
    event: EventStore;
    outbox: OutboxStore;
};

@Injectable()
export class StoreSession {
    constructor(
        @InjectDatabase() private readonly db: NodePgDatabase<any>,
        @InjectConfig() private readonly config: Config,
    ) {}

    async start(tx: PgTransaction<any>): Promise<Session> {
        return {} as any;

        //
        // return {
        //     data: documentStore,
        //     event: eventStore,
        //     outbox: outboxStore,
        // };

        // } catch (error) {
        //     try {
        //         await client.query('ROLLBACK');
        //     } finally {
        //         client.release();
        //     }
        //
        //     throw error;
        // }
    }
}
