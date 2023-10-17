import { Type } from '@nestjs/common';
import { Event } from '../index';
import { ProjectionType } from './projection-type.enum';

export const PROJECTION_HANDLER = 'PROJECTION_HANDLER';

export const PROJECTION_FIELDS = 'PROJECTION_FIELDS';

export const PROJECTION_EVENT_TYPES = 'PROJECTION_EVENT_TYPES';

export type ProjectionOptions = {
  type: ProjectionType;
};

export const Projection = (options?: ProjectionOptions): ClassDecorator => {
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

export const ProjectionEventHandler = <T extends Event>(
  event: Type<T>,
  id: (e: T) => string,
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
