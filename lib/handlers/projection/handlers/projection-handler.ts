import { Type } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTransaction } from 'drizzle-orm/pg-core/session';
import { eq, InferSelectModel } from 'drizzle-orm';

import { eventsTable, tokensTable } from '../../../schema/schema';

export abstract class ProjectionHandler {
    abstract handleEvents(
        db: NodePgDatabase<any> | PgTransaction<any>,
        projection: any,
        projectionType: Type,
        events: InferSelectModel<typeof eventsTable>[],
    ): Promise<InferSelectModel<typeof tokensTable>>;

    async updateTokenPosition(
        db: NodePgDatabase<any> | PgTransaction<any>,
        projectionType: Type,
        lastSequenceId: number,
    ): Promise<InferSelectModel<typeof tokensTable>> {
        const tokenRows = await db
            .update(tokensTable)
            .set({
                name: projectionType.name,
                lastSequenceId,
                timestamp: new Date(),
            })
            .where(eq(tokensTable.name, projectionType.name))
            .returning();

        if (tokenRows.length === 0) {
            throw new Error(
                `could not update projection token for ${projectionType.name}`,
            );
        }

        return tokenRows[0];
    }
}
