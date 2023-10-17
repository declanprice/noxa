import { Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Pool } from 'pg';
import {
  PROJECTION_EVENT_TYPES,
  PROJECTION_HANDLER,
  ProjectionOptions,
} from '../handlers/projection/projection.decorators';
import { StoredProjectionToken } from '../handlers/projection/stored-projection-token';
import { ProjectionType } from '../handlers/';
import { StoredEvent } from '../store/event-store/event/stored-event.type';
import { ProjectionHandlerDocument } from '../handlers/projection/handler/projection-handler-document';
import { ProjectionHandlerGeneric } from '../handlers/projection/handler/projection-handler-generic';

export class EventPoller {
  logger = new Logger(EventPoller.name);

  constructor(
    private readonly connection: Pool,
    private readonly moduleRef: ModuleRef,
  ) {}

  async start(projection: Type) {
    const handlerMetadata = Reflect.getMetadata(
      PROJECTION_HANDLER,
      projection,
    ) as ProjectionOptions;

    const handlerEventTypes: Set<string> = Reflect.getMetadata(
      PROJECTION_EVENT_TYPES,
      projection,
    );

    if (!handlerMetadata) {
      throw Error(`${projection.name} is not a valid @Projection`);
    }

    if (!handlerEventTypes) {
      throw Error(`${projection.name} has no @ProjectionEventHandler's`);
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
    projectionType: ProjectionType,
    eventTypes: string[],
    token: StoredProjectionToken,
  ) {
    const events = await this.connection.query({
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

    let updatedToken: StoredProjectionToken;

    const beforeDate = Date.now();

    const projectionHandlerDocument = new ProjectionHandlerDocument(
      this.moduleRef,
    );

    const projectionHandlerGeneric = new ProjectionHandlerGeneric(
      this.moduleRef,
    );

    switch (projectionType) {
      case ProjectionType.Document:
        updatedToken = await projectionHandlerDocument.handleEvents(
          this.connection,
          projection,
          events.rows as StoredEvent[],
        );
        break;
      case ProjectionType.Generic:
        updatedToken = await projectionHandlerGeneric.handleEvents(
          this.connection,
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

  async getProjectionToken(name: string): Promise<StoredProjectionToken> {
    let storedToken!: StoredProjectionToken;

    const result = await this.connection.query({
      text: 'select * from noxa_projection_tokens where name = $1',
      values: [name],
    });

    if (result.rowCount === 0) {
      const { rows } = await this.connection.query({
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
