import { Type } from '@nestjs/common';

export const PROJECTION_HANDLER = 'PROJECTION_HANDLER';
export const PROJECTION_HANDLER_TYPES = 'PROJECTION_HANDLER_TYPES';
export const PROJECTION_HANDLER_OPTIONS = 'PROJECTION_HANDLER_OPTIONS';

export type ProjectionOptions = {
    batchSize?: number;
};

export const Projection = (options?: ProjectionOptions): ClassDecorator => {
    return (target: object) => {
        Reflect.defineMetadata(PROJECTION_HANDLER, options, target);
        Reflect.defineMetadata(
            PROJECTION_HANDLER_OPTIONS,
            options || { batchEventsSize: 100, fetchEventsSize: 1000 },
            target,
        );
    };
};

export const ProjectionHandler = (type: Type): MethodDecorator => {
    return (target: object, propertyKey: string | symbol) => {
        let eventTypes = Reflect.getMetadata(
            PROJECTION_HANDLER_TYPES,
            target.constructor,
        ) as Set<string> | undefined;

        if (eventTypes) {
            eventTypes.add(type.name);
        } else {
            eventTypes = new Set();
            eventTypes.add(type.name);
        }

        Reflect.defineMetadata(
            PROJECTION_HANDLER_TYPES,
            eventTypes,
            target.constructor,
        );

        Reflect.defineMetadata(
            type.name,
            propertyKey as string,
            target.constructor,
        );
    };
};

export const getProjectionOption = (projection: Type): ProjectionOptions => {
    const options = Reflect.getMetadata(
        PROJECTION_HANDLER_OPTIONS,
        projection,
    ) as ProjectionOptions;

    if (!options) {
        throw new Error(`projection ${projection} has no option metadata.`);
    }

    return options;
};

export const getProjectionHandlerTypes = (projection: Type): Set<string> => {
    const eventTypes = Reflect.getMetadata(
        PROJECTION_HANDLER_TYPES,
        projection,
    );

    if (!eventTypes) {
        throw new Error(`projection ${projection} has no event type metadata.`);
    }

    return eventTypes;
};

export const getProjectionHandlerMethod = (
    target: any,
    eventType: string,
): string => {
    return Reflect.getMetadata(eventType, target);
};
