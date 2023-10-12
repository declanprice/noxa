import { Type } from '@nestjs/common';

import { Event } from '../../../handlers';

export const EVENT_STREAM_METADATA = 'EVENT_STREAM_METADATA';

export type EventStreamOptions = {
  snapshotPeriod?: number;
};

export const EventStream = (options?: EventStreamOptions): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(EVENT_STREAM_METADATA, options, target);
  };
};

export const EventStreamHandler = (event: Type<Event>): MethodDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    const eventType = event.name;
    Reflect.defineMetadata(eventType, propertyKey, target.constructor);
  };
};
