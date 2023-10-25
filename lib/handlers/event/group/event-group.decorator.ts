import { Type } from '@nestjs/common';

import { Event } from '../event.type';

export const EVENT_GROUP_HANDLER_METADATA = 'EVENT_GROUP_HANDLER_METADATA';

export const EVENT_GROUP_EVENT_TYPES_METADATA =
  'EVENT_GROUP_EVENT_TYPES_METADATA';

export type EventGroupOptions = {
  consumerType?: any;
};

export const EventGroup = (options?: EventGroupOptions): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(EVENT_GROUP_HANDLER_METADATA, options, target);
  };
};

export const EventGroupHandler = <E extends Event>(
  event: Type<E>,
): MethodDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    const eventType = event.name;

    let eventTypes = Reflect.getMetadata(
      EVENT_GROUP_EVENT_TYPES_METADATA,
      target.constructor,
    ) as Set<string> | undefined;

    if (eventTypes) {
      eventTypes.add(eventType);
    } else {
      eventTypes = new Set();
      eventTypes.add(eventType);
    }

    Reflect.defineMetadata(
      EVENT_GROUP_EVENT_TYPES_METADATA,
      eventTypes,
      target.constructor,
    );

    Reflect.defineMetadata(eventType, propertyKey, target.constructor);
  };
};

export const getEventGroupOptions = (eventGroup: Type) => {
  const options = Reflect.getMetadata(EVENT_GROUP_HANDLER_METADATA, eventGroup);

  if (!options) {
    throw new Error(`Event group ${eventGroup} has no @EventGroup decorator`);
  }

  return options;
};

export const getEventGroupEventTypes = (eventGroup: Type): Set<string> => {
  const eventTypes = Reflect.getMetadata(
    EVENT_GROUP_EVENT_TYPES_METADATA,
    eventGroup,
  );

  if (!eventTypes) {
    throw new Error(
      `Event group ${eventGroup} has no @EventGroupHandler decorators`,
    );
  }

  return eventTypes;
};

export const getEventGroupHandler = <E extends Event>(
  eventGroup: any,
  eventType: string,
): string => {
  const handlerMetadata = Reflect.getMetadata(eventType, eventGroup) as string;

  if (!handlerMetadata) {
    throw new Error(
      `Event group ${eventGroup} has no @EventGroupHandler for event type ${eventType}`,
    );
  }

  return handlerMetadata;
};
