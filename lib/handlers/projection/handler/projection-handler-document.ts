import { ProjectionHandler } from './projection-handler';
import { Type } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { StoredProjectionToken } from '../stored-projection-token';
import { EventStreamProjectionUnsupportedEventError } from '../../../async-daemon/errors/event-stream-projection-unsupported-event.error';
import { EventStreamProjectionInvalidIdError } from '../../../async-daemon/errors/event-stream-projection-invalid-id.error';
import * as format from 'pg-format';
import { DocumentStore } from '../../../store';
import { StoredDocument } from '../../../store/document-store/document/stored-document.type';
import { StoredEvent } from '../../../store/event-store/event/stored-event.type';

export class ProjectionHandlerDocument extends ProjectionHandler {
  async handleEvents(
    connection: Pool,
    projection: Type,
    events: StoredEvent[],
  ): Promise<StoredProjectionToken> {
    const targetIds: Set<string> = new Set<string>();

    for (const event of events) {
      const targetEventHandler = Reflect.getMetadata(event.type, projection);

      if (!targetEventHandler) {
        throw new EventStreamProjectionUnsupportedEventError(
          projection.name,
          event.type,
        );
      }

      const id = targetEventHandler.id(event.data);

      if (typeof id !== 'string') {
        throw new EventStreamProjectionInvalidIdError();
      }

      targetIds.add(id);
    }

    const existingProjectionRowResults = await connection.query(
      format(
        `select * from ${DocumentStore.getDocumentTableNameFromType(
          projection,
        )} where id IN (%L)`,
        Array.from(targetIds),
      ),
    );

    const projections = new Map<string, Object>();

    // add existing projections
    for (const existingProjection of existingProjectionRowResults.rows as StoredDocument[]) {
      const _projection = new projection();
      Object.assign(_projection, existingProjection.data);
      projections.set(existingProjection.id, _projection);
    }

    // add new projections
    for (const targetId of targetIds) {
      if (!projections.has(targetId)) {
        projections.set(targetId, new projection());
      }
    }

    // apply all events
    for (const event of events) {
      const targetEventHandler = Reflect.getMetadata(event.type, projection);

      const targetId = targetEventHandler.id(event.data);

      const _projection = projections.get(targetId);

      (_projection as any)[targetEventHandler.propertyKey](event.data);
    }

    // insert or update all affected documents and update token within one transaction
    let transaction = await connection.connect();

    try {
      await transaction.query(
        format(
          `insert into ${DocumentStore.getDocumentTableNameFromType(
            projection,
          )} (id, data, "lastModified") values %L`,
          Array.from(projections).map((v) => [
            v[0],
            v[1],
            new Date().toISOString(),
          ]),
        ),
      );

      return await this.updateTokenPosition(
        transaction,
        projection,
        events[events.length - 1].sequenceId,
      );
    } catch (error) {
      await transaction.query('ROLLBACK');
      throw error;
    } finally {
      transaction.release();
    }
  }
}
