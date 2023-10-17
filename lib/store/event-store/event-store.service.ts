import { randomUUID } from 'crypto';
import { Pool, PoolClient } from 'pg';
import { Injectable, Optional, Type } from '@nestjs/common';
import { StoredStream } from './stream/stored-stream.type';
import { StoredEvent } from './event/stored-event.type';
import { Event } from '../../handlers';
import { StreamNotFoundError } from './errors/stream-not-found.error';
import { StreamNoEventsFoundError } from './errors/stream-no-events-found.error';
import { StreamEventHandlerNotAvailableError } from './errors/stream-event-handler-not-available.error';
import { InjectStoreConnection } from '../store-connection.token';

@Injectable()
export class EventStore {
  constructor(
    @InjectStoreConnection()
    private readonly connection: PoolClient | Pool,
  ) {
    console.log('event store was created');
  }

  async startStream(steam: Type, streamId: string, event: Event) {
    try {
      const steamType = steam.name;
      const eventType = event.constructor.name;
      const now = new Date().toISOString();

      const storedStream: StoredStream = {
        id: streamId,
        type: steamType,
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
        streamId,
        timestamp: now,
        isArchived: false,
        tenantId: 'default',
      };

      await this.connection.query({
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

      await this.connection.query({
        text: `insert into noxa_events (
        "id",
        "streamId",
        "version",
        "timestamp",
        "data",
        "type",
        "tenantId",
        "isArchived" 
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        values: [
          storedEvent.id,
          storedEvent.streamId,
          storedEvent.version,
          storedEvent.timestamp,
          storedEvent.data,
          storedEvent.type,
          storedEvent.tenantId,
          storedEvent.isArchived,
        ],
      });
    } catch (error) {
      if (!(this.connection instanceof Pool)) {
        await this.connection.query('ROLLBACK');
        this.connection.release();
      }
      throw error;
    }
  }

  async hydrateStream<T>(stream: Type<T>, streamId: string): Promise<T> {
    try {
      const streamType = stream.name;

      const [streamResult, eventsResult] = await Promise.all([
        this.connection.query({
          text: `select * from noxa_event_streams where type = $1 and id = $2`,
          values: [streamType, streamId],
        }),
        this.connection.query({
          text: `select * from noxa_events where "streamId" = $1 order by version ASC`,
          values: [streamId],
        }),
      ]);

      if (streamResult.rowCount === 0) {
        throw new StreamNotFoundError(streamType, streamId);
      }

      if (eventsResult.rowCount === 0) {
        throw new StreamNoEventsFoundError(streamType, streamId);
      }

      let hydratedStream: T = new stream();

      for (const eventRow of eventsResult.rows as StoredEvent[]) {
        const streamEventHandler = Reflect.getMetadata(eventRow.type, stream);

        if (!streamEventHandler) {
          throw new StreamEventHandlerNotAvailableError(
            streamType,
            eventRow.type,
          );
        }

        (hydratedStream as any)[streamEventHandler](eventRow.data);
      }

      return hydratedStream;
    } catch (error) {
      if (!(this.connection instanceof Pool)) {
        await this.connection.query('ROLLBACK');
        this.connection.release();
      }
      throw error;
    }
  }

  async appendEvent(
    stream: Type,
    streamId: string,
    event: Event,
  ): Promise<void> {
    try {
      const streamType = stream.name;
      const eventType = event.constructor.name;
      const now = new Date().toISOString();

      const streamResult = await this.connection.query({
        text: `select * from noxa_event_streams where type = $1 and id = $2 for update`,
        values: [streamType, streamId],
      });

      if (streamResult.rowCount === 0) {
        throw new StreamNotFoundError(streamType, streamId);
      }

      const streamRow = streamResult.rows[0] as StoredStream;

      const newVersion = Number(streamRow.version) + 1;

      const storedEvent: Partial<StoredEvent> = {
        id: randomUUID(),
        type: eventType,
        data: event,
        version: newVersion,
        streamId,
        timestamp: now,
        isArchived: false,
        tenantId: 'default',
      };

      const storedStream: Partial<StoredStream> = {
        id: streamId,
        type: streamType,
        timestamp: new Date().toISOString(),
        version: newVersion,
      };

      await this.connection.query({
        text: `insert into noxa_events (
        "id",
        "streamId",
        "version",
        "timestamp",
        "data",
        "type",
        "tenantId",
        "isArchived"
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        values: [
          storedEvent.id,
          storedEvent.streamId,
          storedEvent.version,
          storedEvent.timestamp,
          storedEvent.data,
          storedEvent.type,
          storedEvent.tenantId,
          storedEvent.isArchived,
        ],
      });

      await this.connection.query({
        text: `update noxa_event_streams set version = $1, timestamp = $2 where type = $3 and id = $4`,
        values: [
          storedStream.version,
          storedStream.timestamp,
          storedStream.type,
          storedStream.id,
        ],
      });
    } catch (error) {
      if (!(this.connection instanceof Pool)) {
        await this.connection.query('ROLLBACK');
        this.connection.release();
      }
      throw error;
    }
  }

  static async createResources(connection: PoolClient) {
    await connection.query({
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

    await connection.query({
      text: `
        CREATE TABLE IF NOT EXISTS noxa_events (
            "sequenceId" bigserial not null,
            "id" uuid not null,
            "streamId" uuid not null,
            "version" bigint not null,
            "timestamp" timestamp with time zone not null,
            "data" jsonb not null,
            "type" varchar(500) not null,
            "tenantId" varchar default 'default' not null,
            "isArchived" boolean default false not null
      )`,
      values: [],
    });

    await connection.query({
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
