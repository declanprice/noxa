import { Type } from '@nestjs/common';

import { EventMessage } from '../event.type';

export const EVENT_GROUP_HANDLER = 'EVENT_GROUP_HANDLER';

export const EVENT_GROUP_TYPES = 'EVENT_GROUP_TYPES';

export type EventGroupOptions = {
    consumerType?: any;
};

export const EventGroup = (options?: EventGroupOptions): ClassDecorator => {
    return (target: object) => {
        Reflect.defineMetadata(EVENT_GROUP_HANDLER, options, target);
    };
};

export const EventGroupHandler = (type: Type): MethodDecorator => {
    return (target: object, propertyKey: string | symbol) => {
        let eventTypes = Reflect.getMetadata(
            EVENT_GROUP_TYPES,
            target.constructor,
        ) as Set<string> | undefined;

        if (eventTypes) {
            eventTypes.add(type.name);
        } else {
            eventTypes = new Set();
            eventTypes.add(type.name);
        }

        Reflect.defineMetadata(
            EVENT_GROUP_TYPES,
            eventTypes,
            target.constructor,
        );

        Reflect.defineMetadata(type.name, propertyKey, target.constructor);
    };
};

export const getEventGroupOptions = (eventGroup: Type) => {
    const options = Reflect.getMetadata(EVENT_GROUP_HANDLER, eventGroup);

    if (!options) {
        throw new Error(
            `Event group ${eventGroup} has no @EventGroup decorator`,
        );
    }

    return options;
};

export const getEventGroupTypes = (eventGroup: Type): Set<string> => {
    const eventTypes = Reflect.getMetadata(EVENT_GROUP_TYPES, eventGroup);

    if (!eventTypes) {
        throw new Error(
            `Event group ${eventGroup} has no @EventGroupHandler decorators`,
        );
    }

    return eventTypes;
};

export const getEventGroupHandler = (
    eventGroup: any,
    eventType: string,
): string => {
    const metadata = Reflect.getMetadata(eventType, eventGroup) as string;

    if (!metadata) {
        throw new Error(
            `Event group ${eventGroup} has no @EventGroupHandler for event type ${eventType}`,
        );
    }

    return metadata;
};
