import { ProjectionHandler } from './projection-handler';
import { Pool, PoolClient } from 'pg';
import { Type } from '@nestjs/common';
import { StoredProjectionToken } from '../stored-projection-token';
import { EventStreamProjectionUnsupportedEventError } from '../../../async-daemon/errors/event-stream-projection-unsupported-event.error';
import { StoredEvent } from '../../../store/event-store/event/stored-event.type';

export class ProjectionHandlerGeneric extends ProjectionHandler {
  async handleEvents(
    connection: Pool | PoolClient,
    projection: Type,
    events: StoredEvent[],
  ): Promise<StoredProjectionToken> {
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
      connection,
      projection,
      events[events.length - 1].sequenceId,
    );
  }
}
