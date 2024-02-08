import { Type } from '@nestjs/common';


export const STREAM_METADATA = 'STREAM_METADATA';

export type StreamOptions = {
  snapshotPeriod?: number;
};

export const Stream = (options?: StreamOptions): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(STREAM_METADATA, options, target);
  };
};

export const StreamEventHandler = (type: string): MethodDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    Reflect.defineMetadata(type, propertyKey, target.constructor);
  };
};
