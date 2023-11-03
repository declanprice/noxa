import { Type } from '@nestjs/common';

import { Event } from '../../../handlers';

export const STREAM_METADATA = 'STREAM_METADATA';

export type StreamOptions = {
  snapshotPeriod?: number;
};

export const Stream = (options?: StreamOptions): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(STREAM_METADATA, options, target);
  };
};

export const StreamEventHandler = (event: Type<Event>): MethodDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    const eventType = event.name;
    Reflect.defineMetadata(eventType, propertyKey, target.constructor);
  };
};
