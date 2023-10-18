import { Type } from '@nestjs/common';
import { Event } from '../index';
import { ProjectionType } from './projection-type.enum';

export const PROJECTION_HANDLER = 'PROJECTION_HANDLER';

export const PROJECTION_FIELDS = 'PROJECTION_FIELDS';

export const PROJECTION_EVENT_TYPES = 'PROJECTION_EVENT_TYPES';

export type ProjectionOptionsMetadata = {
  type: ProjectionType;
};

export type ProjectionHandlerMetadata<E extends Event> = {
  propertyKey: string;
  id: (event: E) => string;
};

export const Projection = (
  options?: ProjectionOptionsMetadata,
): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(PROJECTION_HANDLER, options, target);
  };
};

export const ProjectionField = (): PropertyDecorator => {
  return (target: Object, propertyKey: string | symbol) => {
    let projectionFields: Set<string> = Reflect.getMetadata(
      PROJECTION_FIELDS,
      target.constructor,
    );

    if (!projectionFields) {
      projectionFields = new Set<string>();
    }

    projectionFields.add(propertyKey as string);

    Reflect.defineMetadata(
      PROJECTION_FIELDS,
      projectionFields,
      target.constructor,
    );
  };
};

export const ProjectionEventHandler = <E extends Event>(
  event: Type<E>,
  id: (e: E) => string,
): MethodDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    const eventType = event.name;

    let eventTypes = Reflect.getMetadata(
      PROJECTION_EVENT_TYPES,
      target.constructor,
    ) as Set<string> | undefined;

    if (eventTypes) {
      eventTypes.add(eventType);
    } else {
      eventTypes = new Set();
      eventTypes.add(eventType);
    }

    Reflect.defineMetadata(
      PROJECTION_EVENT_TYPES,
      eventTypes,
      target.constructor,
    );

    const handlerMetadata: ProjectionHandlerMetadata<E> = {
      propertyKey: propertyKey as string,
      id,
    };

    Reflect.defineMetadata(eventType, handlerMetadata, target.constructor);
  };
};

export const getProjectionOptionMetadata = (
  projection: Type,
): ProjectionOptionsMetadata => {
  const options = Reflect.getMetadata(
    PROJECTION_HANDLER,
    projection,
  ) as ProjectionOptionsMetadata;

  if (!options) {
    throw new Error(`projection ${projection} has no @Projection decorator`);
  }

  return options;
};

export const getProjectionEventTypesMetadata = (
  projection: Type,
): Set<string> => {
  const eventTypes = Reflect.getMetadata(PROJECTION_EVENT_TYPES, projection);

  if (!eventTypes) {
    throw new Error(
      `projection ${projection} has no @ProjectionEventHandler decorators`,
    );
  }

  return eventTypes;
};

export const getProjectionEventHandlerMetadata = <E extends Event>(
  projection: Type,
  eventType: string,
): ProjectionHandlerMetadata<E> => {
  const handlerMetadata = Reflect.getMetadata(
    eventType,
    projection,
  ) as ProjectionHandlerMetadata<E>;

  if (!handlerMetadata) {
    throw new Error(
      `projection ${projection} has no @ProjectionEventHandler for event type ${eventType}`,
    );
  }

  return handlerMetadata;
};
