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

export const StreamHandler = (type: Type): MethodDecorator => {
    return (target: object, propertyKey: string | symbol) => {
        Reflect.defineMetadata(type.name, propertyKey, target.constructor);
    };
};

export const getStreamHandlerMethod = (target: any, type: string): string => {
    return Reflect.getMetadata(type, target);
};
