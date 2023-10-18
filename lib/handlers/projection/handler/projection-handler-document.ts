import { ProjectionHandler } from './projection-handler';
import { Type } from '@nestjs/common';
import { Pool } from 'pg';
import { StoredProjectionToken } from '../stored-projection-token';
import { ProjectionUnsupportedEventError } from '../../../async-daemon/errors/projection-unsupported-event.error';
import { ProjectionInvalidIdError } from '../../../async-daemon/errors/projection-invalid-id.error';
import * as format from 'pg-format';
import { DocumentStore } from '../../../store';
import { StoredDocument } from '../../../store/document-store/document/stored-document.type';
import { StoredEvent } from '../../../store/event-store/event/stored-event.type';
import { PROJECTION_FIELDS } from '../projection.decorators';
import { ProjectionHasNoFieldsError } from '../errors/ProjectionHasNoFields.error';

export class ProjectionHandlerDocument extends ProjectionHandler {
  async handleEvents(
    connection: Pool,
    projection: Type,
    events: StoredEvent[],
  ): Promise<StoredProjectionToken> {
    const targetProjectionIds: Set<string> = new Set<string>();

    for (const event of events) {
      const targetEventHandler = Reflect.getMetadata(event.type, projection);

      if (!targetEventHandler) {
        throw new ProjectionUnsupportedEventError(projection.name, event.type);
      }

      const id = targetEventHandler.id(event.data);

      if (typeof id !== 'string') {
        throw new ProjectionInvalidIdError();
      }

      targetProjectionIds.add(id);
    }

    const existingProjectionRowResults = await connection.query(
      format(
        `select * from ${DocumentStore.tableNameFromType(
          projection,
        )} where id IN (%L)`,
        Array.from(targetProjectionIds),
      ),
    );

    // Map<projectionId, projectionData>
    const projectionData = new Map<string, any>();

    const projectionInstance = this.moduleRef.get(projection, {
      strict: false,
    });

    const projectionFields: Set<string> = Reflect.getMetadata(
      PROJECTION_FIELDS,
      projection,
    );

    if (!projectionFields) {
      throw new ProjectionHasNoFieldsError(projection.name);
    }

    // add existing projection data to map
    for (const existingProjection of existingProjectionRowResults.rows as StoredDocument[]) {
      projectionData.set(existingProjection.id, existingProjection.data);
    }

    // add new projection data to map
    for (const targetProjectionId of targetProjectionIds) {
      if (!projectionData.has(targetProjectionId)) {
        projectionData.set(targetProjectionId, {});
      }
    }

    // apply all events to projection instances
    for (const event of events) {
      const targetEventHandler = Reflect.getMetadata(event.type, projection);

      if (!targetEventHandler) {
        throw new ProjectionUnsupportedEventError(projection.name, event.type);
      }

      const targetProjectionId = targetEventHandler.id(event.data);

      const existingProjectionData: any =
        projectionData.get(targetProjectionId);

      // reset projection fields
      Object.keys(projectionInstance).forEach((key) => {
        if (projectionFields.has(key)) {
          projectionInstance[key] = undefined;
        }
      });

      // assign existing data to projection instance
      Object.assign(projectionInstance, existingProjectionData);

      // apply event over projection instance
      projectionInstance[targetEventHandler.propertyKey](event.data);

      let updatedData: any = {};

      Object.keys(projectionInstance).forEach((key) => {
        if (projectionFields.has(key)) {
          updatedData[key] = projectionInstance[key];
        }
      });

      // set projection data in map
      projectionData.set(targetProjectionId, { ...updatedData });
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
          Array.from(projectionData).map((v) => [
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
