import { HandleEvent } from './handle-event';
import { Type } from '@nestjs/common';

export const EVENT_HANDLER_TYPE = 'EVENT_HANDLER_METADATA';

export const EVENT_HANDLER_OPTIONS = 'EVENT_HANDLER_OPTIONS_METADATA';

export type EventHandlerOptions = {
    consumerType?: any;
};

export const EventHandler = (
    event: Type,
    options: EventHandlerOptions = {},
): ClassDecorator => {
    return (target: object) => {
        Reflect.defineMetadata(EVENT_HANDLER_OPTIONS, options, target);
        Reflect.defineMetadata(EVENT_HANDLER_TYPE, event.name, target);
    };
};

export const getEventHandlerType = (handler: Type<HandleEvent>): string => {
    const eventType = Reflect.getMetadata(EVENT_HANDLER_TYPE, handler);

    if (!eventType) {
        throw new Error(
            `Event handler ${handler.name} has no @EventHandler decorator`,
        );
    }

    return eventType;
};

export const getEventHandlerOptions = (
    handler: Type<HandleEvent>,
): EventHandlerOptions => {
    const options = Reflect.getMetadata(EVENT_HANDLER_OPTIONS, handler);

    if (!options) {
        throw new Error(
            `Event handler ${handler.name} has no @EventHandler decorator`,
        );
    }

    return options;
};
