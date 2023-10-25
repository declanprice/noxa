import { Type } from '@nestjs/common';
import { Pool } from 'pg';
import * as format from 'pg-format';
import { ProjectionHandler } from './projection-handler';
import { StoredProjectionToken } from '../stored-projection-token';
import { ProjectionUnsupportedEventError } from '../../../async-daemon/errors/projection-unsupported-event.error';
import { ProjectionInvalidIdError } from '../../../async-daemon/errors/projection-invalid-id.error';
import { DocumentStore } from '../../../store';
import { StoredDocument } from '../../../store/document-store/document/stored-document.type';
import { StoredEvent } from '../../../store/event-store/event/stored-event.type';

export class DocumentProjectionHandler extends ProjectionHandler {
  async handleEvents(
    connection: Pool,
    projection: Type,
    events: StoredEvent[],
  ): Promise<StoredProjectionToken> {
    const targetDocumentIds: Set<string> = new Set<string>();

    for (const event of events) {
      const targetEventHandler = Reflect.getMetadata(event.type, projection);

      if (!targetEventHandler) {
        throw new ProjectionUnsupportedEventError(projection.name, event.type);
      }

      const id = targetEventHandler.id(event.data);

      if (typeof id !== 'string') {
        throw new ProjectionInvalidIdError();
      }

      targetDocumentIds.add(id);
    }

    const existingDocumentRows = await connection.query(
      format(
        `select * from ${DocumentStore.tableNameFromType(
          projection,
        )} where id IN (%L)`,
        Array.from(targetDocumentIds),
      ),
    );

    // Map<projectionId, projectionData>
    const existingDocuments = new Map<string, any>();

    const handlerInstance = this.moduleRef.get(projection, {
      strict: false,
    });

    // add existing projection data to map
    for (const existingDocument of existingDocumentRows.rows as StoredDocument[]) {
      existingDocuments.set(existingDocument.id, existingDocument.data);
    }

    // add new projection data to map
    for (const targetDocumentId of targetDocumentIds) {
      if (!existingDocuments.has(targetDocumentId)) {
        existingDocuments.set(targetDocumentId, {});
      }
    }

    // apply all events to projection instances
    for (const event of events) {
      const targetEventHandler = Reflect.getMetadata(event.type, projection);

      if (!targetEventHandler) {
        throw new ProjectionUnsupportedEventError(projection.name, event.type);
      }

      const targetDocumentId = targetEventHandler.id(event.data);

      const existingDocument: any = existingDocuments.get(targetDocumentId);

      const updatedDocument = handlerInstance[targetEventHandler.propertyKey](
        event.data,
        existingDocument,
      );

      existingDocuments.set(targetDocumentId, updatedDocument);
    }

    // commit projection document and token updates within one transaction
    let transaction = await connection.connect();

    try {
      await transaction.query(
        format(
          `insert into ${DocumentStore.tableNameFromType(
            projection,
          )} (id, data, "lastModified") values %L 
            on conflict (id) do update set
            data = excluded.data,
            "lastModified" = excluded."lastModified"`,
          Array.from(existingDocuments).map((v) => [
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
