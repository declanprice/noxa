import { Logger, Type } from '@nestjs/common';
import {
  EVENT_STREAM_PROJECTION_EVENT_TYPES,
  EVENT_STREAM_PROJECTION_HANDLER,
  EventStreamProjectionOptions,
} from '../event-stream-projection/event-stream-projection.decorators';
import { Pool, PoolClient } from 'pg';
import { StoredEventStreamProjectionToken } from '../store/event-store/event-stream/stored-event-stream-projection-token';
import { EventStreamProjectionType } from '../event-stream-projection/event-stream-projection-type.enum';
import { StoredEvent } from '../store/event-store/event/stored-event.type';
import { EventStreamProjectionUnsupportedEventError } from './errors/event-stream-projection-unsupported-event.error';
import { EventStreamProjectionInvalidIdError } from './errors/event-stream-projection-invalid-id.error';
import { DocumentStore } from '../store';
import * as format from 'pg-format';
import { StoredDocument } from '../store/document-store/document/stored-document.type';
import { ModuleRef } from '@nestjs/core';

export class EventPoller {
  logger = new Logger(EventPoller.name);

  constructor(
    private readonly client: Pool,
    private readonly moduleRef: ModuleRef,
  ) {}

  async start(projection: Type) {
    const handlerMetadata = Reflect.getMetadata(
      EVENT_STREAM_PROJECTION_HANDLER,
      projection,
    ) as EventStreamProjectionOptions;

    const handlerEventTypes: Set<string> = Reflect.getMetadata(
      EVENT_STREAM_PROJECTION_EVENT_TYPES,
      projection,
    );

    if (!handlerMetadata) {
      throw Error(`${projection.name} is not a valid @EventStreamProjection`);
    }

    if (!handlerEventTypes) {
      throw Error(`${projection.name} has no @EventStreamProjectionHandler's`);
    }

    const token = await this.getProjectionToken(projection.name);

    this.pollEvents(
      projection,
      handlerMetadata.type,
      Array.from(handlerEventTypes),
      token,
    ).then();
  }

  async pollEvents(
    projection: Type,
    projectionType: EventStreamProjectionType,
    eventTypes: string[],
    token: StoredEventStreamProjectionToken,
  ) {
    const events = await this.client.query({
      text: `select * from noxa_events WHERE "type" = ANY ($1) AND "sequenceId" > $2 order by "sequenceId" asc limit $3`,
      values: [eventTypes, token.lastSequenceId, 25000],
    });

    if (events.rowCount === 0) {
      this.logger.log('no new events available, checking again in 1 second.');

      return setTimeout(() => {
        this.pollEvents(projection, projectionType, eventTypes, token).then();
      }, 1000);
    }

    this.logger.log(
      `${events.rowCount} events available, processing batch now.`,
    );

    let updatedToken: StoredEventStreamProjectionToken;

    const beforeDate = Date.now();

    switch (projectionType) {
      case EventStreamProjectionType.Document:
        updatedToken = await this.handleDocumentEventBatch(
          projection,
          events.rows as StoredEvent[],
        );
        break;
      case EventStreamProjectionType.Generic:
        updatedToken = await this.handleGenericEventBatch(
          projection,
          events.rows as StoredEvent[],
        );
        break;
      default:
        this.logger.log(
          'Projection type must be either [Document] or [Generic]',
        );
        break;
    }

    this.logger.log(
      `successfully processed batch of ${events.rowCount} in ${Math.abs(
        (beforeDate - Date.now()) / 1000,
      )} seconds., checking for more events in 1 second.`,
    );

    return setTimeout(() => {
      this.pollEvents(
        projection,
        projectionType,
        eventTypes,
        updatedToken,
      ).then();
    }, 1000);
  }

  async handleDocumentEventBatch(
    projection: Type,
    events: StoredEvent[],
  ): Promise<StoredEventStreamProjectionToken> {
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

    const existingProjectionRowResults = await this.client.query(
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

    // apply changes
    let connection = await this.client.connect();

    try {
      await connection.query(
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
        connection,
        projection,
        events[events.length - 1].sequenceId,
      );
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  }

  async handleGenericEventBatch(
    projection: Type,
    events: StoredEvent[],
  ): Promise<StoredEventStreamProjectionToken> {
    const instance = this.moduleRef.get(projection, { strict: false });

    for (const event of events) {
      const targetEventHandler = Reflect.getMetadata(event.type, projection);

      if (!targetEventHandler) {
        throw new EventStreamProjectionUnsupportedEventError(
          projection.name,
          event.type,
        );
      }

      await instance[targetEventHandler.propertyKey](event.data);
    }

    return await this.updateTokenPosition(
      this.client,
      projection,
      events[events.length - 1].sequenceId,
    );
  }

  async updateTokenPosition(
    client: Pool | PoolClient,
    projection: Type,
    lastSequenceId: number,
  ): Promise<StoredEventStreamProjectionToken> {
    const { rows, rowCount } = await client.query({
      text: `update noxa_projection_tokens set "lastSequenceId" = $1, "lastUpdated" = $2 where "name" = $3 returning *`,
      values: [lastSequenceId, new Date().toISOString(), projection.name],
    });

    if (rowCount === 0) {
      throw new Error(
        `could not update projection token for ${projection.name}`,
      );
    }

    return rows[0] as StoredEventStreamProjectionToken;
  }

  async getProjectionToken(
    name: string,
  ): Promise<StoredEventStreamProjectionToken> {
    let storedToken!: StoredEventStreamProjectionToken;

    const result = await this.client.query({
      text: 'select * from noxa_projection_tokens where name = $1',
      values: [name],
    });

    if (result.rowCount === 0) {
      const { rows } = await this.client.query({
        text: `insert into noxa_projection_tokens ("name", "lastSequenceId", "lastUpdated") values ($1, $2, $3) returning *`,
        values: [name, -1, new Date().toISOString()],
      });

      storedToken = rows[0];
    } else {
      storedToken = result.rows[0];
    }

    return storedToken;
  }
}
