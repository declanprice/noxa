import { randomUUID } from 'crypto';
import { PoolClient } from 'pg';
import { Injectable, Type } from '@nestjs/common';
import { StoredEventStream } from './event-stream/stored-event-stream.type';
import { StoredEvent } from './event/stored-event.type';
import { Event } from '../../handlers';
import { EventStreamNotFoundError } from './errors/event-stream-not-found.error';
import { EventStreamNoEventsFoundError } from './errors/event-stream-no-events-found.error';
import { EventStreamHandlerNotAvailableError } from './errors/event-stream-handler-not-available.error';

@Injectable()
export class EventStore {
  constructor(private readonly client: PoolClient) {
    console.log('event store was created');
  }

  async startStream(eventStream: Type, eventStreamId: string, event: Event) {
    try {
      const eventStreamType = eventStream.name;
      const eventType = event.constructor.name;
      const now = new Date().toISOString();

      const storedStream: StoredEventStream = {
        id: eventStreamId,
        type: eventStreamType,
        version: 0,
        snapshot: null,
        snapshotVersion: null,
        created: now,
        timestamp: now,
        isArchived: false,
        tenantId: 'default',
      };

      const storedEvent: Partial<StoredEvent> = {
        id: randomUUID(),
        type: eventType,
        data: event,
        version: 0,
        eventStreamId,
        timestamp: now,
        isArchived: false,
        tenantId: 'default',
      };

      await this.client.query({
        text: `insert into noxa_event_streams (
        "id",
        "type",
        "version",
        "snapshot",
        "snapshotVersion",
        "created",
        "timestamp",
        "tenantId",
        "isArchived"
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        values: [
          storedStream.id,
          storedStream.type,
          storedStream.version,
          storedStream.snapshot,
          storedStream.snapshotVersion,
          storedStream.created,
          storedStream.timestamp,
          storedStream.tenantId,
          storedStream.isArchived,
        ],
      });

      await this.client.query({
        text: `insert into noxa_events (
        "id",
        "eventStreamId",
        "version",
        "timestamp",
        "data",
        "type",
        "tenantId",
        "isArchived" 
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        values: [
          storedEvent.id,
          storedEvent.eventStreamId,
          storedEvent.version,
          storedEvent.timestamp,
          storedEvent.data,
          storedEvent.type,
          storedEvent.tenantId,
          storedEvent.isArchived,
        ],
      });
    } catch (error) {
      await this.client.query('ROLLBACK');
      this.client.release();
      throw error;
    }
  }

  async hydrateStream<T>(
    eventStream: Type<T>,
    eventStreamId: string,
  ): Promise<T> {
    try {
      const eventStreamType = eventStream.name;

      const [eventStreamResult, eventsResult] = await Promise.all([
        this.client.query({
          text: `select * from noxa_event_streams where type = $1 and id = $2`,
          values: [eventStreamType, eventStreamId],
        }),
        this.client.query({
          text: `select * from noxa_events where eventStreamId = $1 order by version ASC`,
          values: [eventStreamId],
        }),
      ]);

      if (eventStreamResult.rowCount === 0) {
        throw new EventStreamNotFoundError(eventStreamType, eventStreamId);
      }

      if (eventsResult.rowCount === 0) {
        throw new EventStreamNoEventsFoundError(eventStreamType, eventStreamId);
      }

      let hydratedStream: T = new eventStream();

      for (const eventRow of eventsResult.rows as StoredEvent[]) {
        const eventStreamHandler = Reflect.getMetadata(
          eventRow.type,
          eventStream,
        );

        if (!eventStreamHandler) {
          throw new EventStreamHandlerNotAvailableError(
            eventStreamType,
            eventRow.type,
          );
        }

        (hydratedStream as any)[eventStreamHandler](eventRow.data);
      }

      return hydratedStream;
    } catch (error) {
      await this.client.query('ROLLBACK');
      this.client.release();
      throw error;
    }
  }

  async appendEvent(
    eventStream: Type,
    eventStreamId: string,
    event: Event,
  ): Promise<void> {
    try {
      const eventStreamType = eventStream.name;
      const eventType = event.constructor.name;
      const now = new Date().toISOString();

      const eventStreamResult = await this.client.query({
        text: `select * from noxa_event_streams where type = $1 and id = $2 for update`,
        values: [eventStreamType, eventStreamId],
      });

      if (eventStreamResult.rowCount === 0) {
        throw new EventStreamNotFoundError(eventStreamType, eventStreamId);
      }

      const eventStreamRow = eventStreamResult.rows[0] as StoredEventStream;

      const newVersion = Number(eventStreamRow.version) + 1;

      const storedEvent: Partial<StoredEvent> = {
        id: randomUUID(),
        type: eventType,
        data: event,
        version: newVersion,
        eventStreamId,
        timestamp: now,
        isArchived: false,
        tenantId: 'default',
      };

      const storedEventStream: Partial<StoredEventStream> = {
        id: eventStreamId,
        type: eventStreamType,
        timestamp: new Date().toISOString(),
        version: newVersion,
      };

      await this.client.query({
        text: `insert into noxa_events (
        "id",
        "eventStreamId",
        "version",
        "timestamp",
        "data",
        "type",
        "tenantId",
        "isArchived"
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        values: [
          storedEvent.id,
          storedEvent.eventStreamId,
          storedEvent.version,
          storedEvent.timestamp,
          storedEvent.data,
          storedEvent.type,
          storedEvent.tenantId,
          storedEvent.isArchived,
        ],
      });

      await this.client.query({
        text: `update noxa_event_streams set version = $1, timestamp = $2 where type = $3 and id = $4`,
        values: [
          storedEventStream.version,
          storedEventStream.timestamp,
          storedEventStream.type,
          storedEventStream.id,
        ],
      });
    } catch (error) {
      await this.client.query('ROLLBACK');
      this.client.release();
      throw error;
    }
  }

  static async createResources(client: PoolClient) {
    await client.query({
      text: `
        CREATE TABLE IF NOT EXISTS noxa_event_streams (
            "id" uuid not null,
            "type" varchar(500) not null,
            "version" bigint not null,
            "snapshot" jsonb null,
            "snapshotVersion" bigint null,
            "created" timestamp with time zone not null,
            "timestamp" timestamp with time zone not null,
            "tenantId" varchar default 'default' not null,
            "isArchived" boolean default false not null
      )`,
      values: [],
    });

    await client.query({
      text: `
        CREATE TABLE IF NOT EXISTS noxa_events (
            "sequenceId" bigserial not null,
            "id" uuid not null,
            "eventStreamId" uuid not null,
            "version" bigint not null,
            "timestamp" timestamp with time zone not null,
            "data" jsonb not null,
            "type" varchar(500) not null,
            "tenantId" varchar default 'default' not null,
            "isArchived" boolean default false not null
      )`,
      values: [],
    });

    await client.query({
      text: `
        CREATE TABLE IF NOT EXISTS noxa_projection_tokens (
            "name" varchar(250) not null,
            "lastSequenceId" bigserial not null,
            "lastUpdated" timestamp with time zone not null
      )`,
      values: [],
    });
  }
}
