import { Event } from '../event/event.type';
import { Type } from '@nestjs/common';
import {
  PROCESS_HANDLER_METADATA,
  ProcessOptionsMetadata,
} from '../process/process.decorators';

export type SagaOptionsMetadata = {
  consumerType: any;
};

export type SagaStartEventMetadata<E extends Event> = {
  event: Type<E>;
  associationId: (event: E) => string;
};

export const SAGA_HANDLER_METADATA = 'SAGA_HANDLER_METADATA';

export const SAGA_EVENT_TYPES = 'SAGA_EVENT_TYPES';

export const SAGA_EVENT_START_EVENT = 'SAGA_EVENT_START_EVENT';

export const SAGA_START_HANDLER = 'SAGA_START_HANDLER';

export const Saga = (options: SagaOptionsMetadata): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(SAGA_HANDLER_METADATA, options, target);
  };
};

export const StartSagaHandler = <E extends Event>(options: {
  startOn: { event: Type<E>; associationId: (event: E) => string };
  listenFor: Type<Event>[];
}): MethodDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    const { startOn, listenFor } = options;

    for (const event of listenFor) {
      const eventType = event.name;

      let eventTypes = Reflect.getMetadata(
        SAGA_EVENT_TYPES,
        target.constructor,
      ) as Set<string> | undefined;

      if (eventTypes) {
        eventTypes.add(eventType);
      } else {
        eventTypes = new Set();
        eventTypes.add(eventType);
      }

      Reflect.defineMetadata(SAGA_EVENT_TYPES, eventTypes, target.constructor);
      Reflect.defineMetadata(
        SAGA_START_HANDLER,
        propertyKey,
        target.constructor,
      );
      Reflect.defineMetadata(
        SAGA_EVENT_START_EVENT,
        startOn as SagaStartEventMetadata<E>,
        target.constructor,
      );
    }
  };
};

export const getSagaOptionMetadata = (saga: Type): ProcessOptionsMetadata => {
  const options = Reflect.getMetadata(SAGA_HANDLER_METADATA, saga);

  if (!options) {
    throw new Error(`saga ${saga} has no @Saga decorator`);
  }

  return options;
};

export const getSagaEventTypes = (saga: Type) => {
  const eventTypes = Reflect.getMetadata(SAGA_EVENT_TYPES, saga);

  if (!eventTypes) {
    throw new Error(`saga ${saga} has no @StartSaga decorator`);
  }

  return eventTypes;
};

export const getSagaStartHandler = (saga: Type): string => {
  const handler = Reflect.getMetadata(SAGA_START_HANDLER, saga);

  if (!handler) {
    throw new Error(`saga ${saga} has no @StartSaga decorator`);
  }

  return handler;
};

export const getSagaStartEvent = <E extends Event>(
  saga: Type,
): SagaStartEventMetadata<E> => {
  const eventType = Reflect.getMetadata(SAGA_EVENT_START_EVENT, saga);

  if (!eventType) {
    throw new Error(`saga ${saga} has no @StartSaga decorator`);
  }

  return eventType;
};
