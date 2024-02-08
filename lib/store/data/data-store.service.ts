import { Injectable } from '@nestjs/common';
import { DatabaseService, DatabaseTransactionClient } from '../database.service';

@Injectable()
export class DataStore {
    constructor(
        private readonly db: DatabaseService
    ) {}

    // query<T extends PgTable>(
    //     table: T,
    //     options: { tx?: DatabaseTransactionClient } = {},
    // ) {
    //     const { tx } = options;
    //
    //     let db = tx ?? this.db;
    //
    //     return db.select().from(table);
    // }

    // async get<T extends PgTable>(
    //     table: T,
    //     id: string,
    //     options: { tx?: PgTransaction<any, any, any> } = {},
    // ) {
    //     const { tx } = options;
    //
    //     let db = tx ?? this.db;
    //
    //     const results = await db
    //         .select()
    //         .from(table)
    //         .where(eq((table as any).id, id));
    //
    //     if (results.length === 0) {
    //         throw new DataNotFoundError();
    //     }
    //
    //     return results[0];
    // }
    //
    // async find<T extends PgTable>(
    //     table: T,
    //     id: string,
    //     options: { tx?: PgTransaction<any, any, any> } = {},
    // ) {
    //     const { tx } = options;
    //
    //     let db = tx ?? this.db;
    //
    //     const results = await db
    //         .select()
    //         .from(table)
    //         .where(eq((table as any).id, id));
    //
    //     if (results.length === 0) {
    //         return null;
    //     }
    //
    //     return results[0];
    // }
    //
    // async findMany<T extends PgTable>(
    //     table: T,
    //     ids: string[],
    //     options: { tx?: PgTransaction<any, any, any> } = {},
    // ) {
    //     const { tx } = options;
    //
    //     let db = tx ?? this.db;
    //
    //     return db
    //         .select()
    //         .from(table)
    //         .where(inArray((table as any).id, ids));
    // }
    //
    // async store<T extends PgTable>(
    //     table: T,
    //     values: InferInsertModel<T>,
    //     options: { tx?: PgTransaction<any, any, any> } = {},
    // ) {
    //     const { tx } = options;
    //
    //     let db = tx ?? this.db;
    //
    //     const result = await db
    //         .insert(table)
    //         .values(values)
    //         .onConflictDoUpdate({
    //             target: (table as any).id,
    //             set: values as any,
    //         })
    //         .returning();
    //
    //     return result[0];
    // }
    //
    // async storeMany<T extends PgTable>(
    //     table: T,
    //     values: InferInsertModel<T>[],
    //     options: { tx?: PgTransaction<any, any, any> } = {},
    // ) {
    //     const { tx } = options;
    //
    //     let db = tx ?? this.db;
    //
    //     if (!values.length) {
    //         throw new Error(
    //             'you must provide at least one valid data to store',
    //         );
    //     }
    //
    //     const onConflictSet: any = {};
    //
    //     for (const key of Object.keys(table)) {
    //         const column = (table as any)[key];
    //         onConflictSet[key] = sql.raw(`excluded.${column.name}`);
    //     }
    //
    //     return db
    //         .insert(table)
    //         .values(values)
    //         .onConflictDoUpdate({
    //             target: (table as any).id,
    //             set: onConflictSet,
    //         })
    //         .returning();
    // }
    //
    // async delete(
    //     table: PgTable,
    //     id: string,
    //     options: { tx?: PgTransaction<any, any, any> } = {},
    // ): Promise<void> {
    //     const { tx } = options;
    //
    //     let db = tx ?? this.db;
    //
    //     return db.delete(table).where(eq((table as any).id, id));
    // }
}
