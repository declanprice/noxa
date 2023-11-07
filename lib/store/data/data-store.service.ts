import { Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, inArray, InferInsertModel, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { PgTransaction } from 'drizzle-orm/pg-core/session';

import { InjectDatabase } from '../database.token';
import { DocumentNotFoundError } from './errors/document-not-found.error';
import { customers } from '../../../src/schema';

@Injectable()
export class DataStore {
    constructor(
        @InjectDatabase()
        private readonly db: NodePgDatabase<any>,
    ) {}

    query(table: PgTable, options: { tx?: PgTransaction<any> } = {}) {
        const { tx } = options;

        let db = tx ?? this.db;

        return db.select().from(table);
    }

    async get<T extends PgTable>(
        table: T,
        documentId: string,
        options: { tx?: PgTransaction<any> } = {},
    ) {
        const { tx } = options;

        let db = tx ?? this.db;

        const results = await db
            .select()
            .from(table)
            .where(eq((table as any).id, documentId));

        if (results.length === 0) {
            throw new DocumentNotFoundError();
        }

        return results[0];
    }

    async find<T extends PgTable>(
        table: T,
        documentId: string,
        options: { tx?: PgTransaction<any> } = {},
    ) {
        const { tx } = options;

        let db = tx ?? this.db;

        const results = await db
            .select()
            .from(table)
            .where(eq((table as any).id, documentId));

        if (results.length === 0) {
            return null;
        }

        return results[0];
    }

    async findMany<T extends PgTable>(
        table: T,
        documentIds: string[],
        options: { tx?: PgTransaction<any> } = {},
    ) {
        const { tx } = options;

        let db = tx ?? this.db;

        return db
            .select()
            .from(table)
            .where(inArray((table as any).id, documentIds));
    }

    async store<T extends PgTable>(
        table: T,
        values: InferInsertModel<T>,
        options: { tx?: PgTransaction<any> } = {},
    ): Promise<void> {
        const { tx } = options;

        let db = tx ?? this.db;

        await db
            .insert(table)
            .values(values)
            .onConflictDoUpdate({
                target: (table as any).id,
                set: values as any,
            });
    }

    async storeMany<T extends PgTable>(
        table: T,
        values: InferInsertModel<T>[],
        options: { tx?: PgTransaction<any> } = {},
    ): Promise<void> {
        const { tx } = options;

        let db = tx ?? this.db;

        if (!values.length) {
            throw new Error(
                'you must provide at least one valid data to store',
            );
        }

        const onConflictSet: any = {};

        for (const key of Object.keys(table)) {
            const column = (table as any)[key];
            onConflictSet[key] = sql.raw(`excluded.${column.name}`);
        }

        await db.insert(table).values(values).onConflictDoUpdate({
            target: customers.id,
            set: onConflictSet,
        });
    }

    async delete(
        table: PgTable,
        id: string,
        options: { tx?: PgTransaction<any> } = {},
    ): Promise<void> {
        const { tx } = options;

        let db = tx ?? this.db;

        await db.delete(table).where(eq((table as any).id, id));
    }
}
