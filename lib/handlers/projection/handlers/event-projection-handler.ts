import { ProjectionHandler } from './projection-handler';
import { Pool, PoolClient } from 'pg';
import { Type } from '@nestjs/common';
import { StoredProjectionToken } from '../stored-projection-token';
import { ProjectionUnsupportedEventError } from '../../../async-daemon/errors/projection-unsupported-event.error';
import { StoredEvent } from '../../../store/event-store/event/stored-event.type';

export class EventProjectionHandler extends ProjectionHandler {
  async handleEvents(
    connection: Pool | PoolClient,
    projection: any,
    projectionType: Type,
    events: StoredEvent[],
  ): Promise<StoredProjectionToken> {

    for (const event of events) {
      const targetEventHandler = Reflect.getMetadata(event.type, projectionType);

      if (!targetEventHandler) {
        throw new ProjectionUnsupportedEventError(projectionType.name, event.type);
      }

      await projection[targetEventHandler.propertyKey](event.data);
    }

    return await this.updateTokenPosition(
      connection,
      projectionType,
      events[events.length - 1].sequenceId,
    );
  }
}
