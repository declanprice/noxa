import { Type } from '@nestjs/common';
import { Event } from '../index';

export const EVENT_PROJECTION_HANDLER = 'EVENT_PROJECTION_HANDLER';

export const DOCUMENT_PROJECTION_HANDLER = 'DOCUMENT_PROJECTION_HANDLER';

export const PROJECTION_OPTIONS_METADATA = 'PROJECTION_OPTIONS_METADATA';

export const PROJECTION_EVENT_TYPES = 'PROJECTION_EVENT_TYPES';

export type ProjectionOptionsMetadata = {
  fetchEventsSize?: number;
  batchEventsSize?: number;
};

export type ProjectionHandlerMetadata<E extends Event> = {
  propertyKey: string;
  id: (event: E) => string;
};

export const EventProjection = (
  options?: ProjectionOptionsMetadata,
): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(EVENT_PROJECTION_HANDLER, options, target);
    Reflect.defineMetadata(
      PROJECTION_OPTIONS_METADATA,
      options || { batchEventsSize: 100, fetchEventsSize: 1000 },
      target,
    );
  };
};

export const DocumentProjection = (
  document: Type,
  options?: ProjectionOptionsMetadata,
): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(DOCUMENT_PROJECTION_HANDLER, document, target);
    Reflect.defineMetadata(
      PROJECTION_OPTIONS_METADATA,
      options || { batchEventsSize: 2500, fetchEventsSize: 2500 },
      target,
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
    PROJECTION_OPTIONS_METADATA,
    projection,
  ) as ProjectionOptionsMetadata;

  if (!options) {
    throw new Error(`projection ${projection} has no option metadata.`);
  }

  return options;
};

export const getProjectionDocumentMetadata = (projection: Type): Type => {
  const document = Reflect.getMetadata(
    DOCUMENT_PROJECTION_HANDLER,
    projection,
  ) as Type;

  if (!document) {
    throw new Error(`projection ${projection} has no document metadata.`);
  }

  return document;
};

export const getProjectionEventTypesMetadata = (
  projection: Type,
): Set<string> => {
  const eventTypes = Reflect.getMetadata(PROJECTION_EVENT_TYPES, projection);

  if (!eventTypes) {
    throw new Error(`projection ${projection} has no event type metadata.`);
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
      `projection ${projection} has no handler metadata for event type ${eventType}`,
    );
  }

  return handlerMetadata;
};
