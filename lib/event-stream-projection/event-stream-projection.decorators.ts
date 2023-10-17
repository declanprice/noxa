import { Type } from '@nestjs/common';
import { Event } from '../handlers';
import { EventStreamProjectionType } from './event-stream-projection-type.enum';

export const EVENT_STREAM_PROJECTION_HANDLER =
  'EVENT_STREAM_PROJECTION_HANDLER';

export const EVENT_STREAM_PROJECTION_EVENT_TYPES =
  'EVENT_STREAM_PROJECTION_EVENT_TYPES';

export type EventStreamProjectionOptions = {
  type: EventStreamProjectionType;
};

export const EventStreamProjection = (
  options?: EventStreamProjectionOptions,
): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(EVENT_STREAM_PROJECTION_HANDLER, options, target);
  };
};

export const EventStreamProjectionHandler = <T extends Event>(
  event: Type<T>,
  id: (e: T) => string,
): MethodDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    const eventType = event.name;

    let eventTypes = Reflect.getMetadata(
      EVENT_STREAM_PROJECTION_EVENT_TYPES,
      target.constructor,
    ) as Set<string> | undefined;

    if (eventTypes) {
      eventTypes.add(eventType);
    } else {
      eventTypes = new Set();
      eventTypes.add(eventType);
    }

    Reflect.defineMetadata(
      EVENT_STREAM_PROJECTION_EVENT_TYPES,
      eventTypes,
      target.constructor,
    );

    Reflect.defineMetadata(
      eventType,
      {
        propertyKey,
        id,
      },
      target.constructor,
    );
  };
};
