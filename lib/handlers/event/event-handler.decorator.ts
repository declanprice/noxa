import { Event } from './event.type';
import { HandleEvent } from './handle-event';
import { Type } from '@nestjs/common';

export const EVENT_HANDLER_METADATA = 'EVENT_HANDLER_METADATA';

export const EVENT_HANDLER_OPTIONS_METADATA = 'EVENT_HANDLER_OPTIONS_METADATA';

export type EventHandlerOptions = {
    consumerType?: any;
};

export const EventHandler = (
    event: Type<Event>,
    options?: EventHandlerOptions,
): ClassDecorator => {
    return (target: object) => {
        Reflect.defineMetadata(EVENT_HANDLER_OPTIONS_METADATA, options, target);
        Reflect.defineMetadata(EVENT_HANDLER_METADATA, event, target);
    };
};

export const getEventHandler = (handler: Type<HandleEvent>) => {
    const event = Reflect.getMetadata(
        EVENT_HANDLER_METADATA,
        handler,
    ) as Type<Event>;

    if (!event) {
        throw new Error(
            `Event handler ${handler.name} has no @EventHandler decorator`,
        );
    }

    return event;
};

export const getEventHandlerOptions = (handler: Type<HandleEvent>) => {
    const options = Reflect.getMetadata(
        EVENT_HANDLER_OPTIONS_METADATA,
        handler,
    );

    if (!options) {
        throw new Error(
            `Event handler ${handler.name} has no @EventHandler decorator`,
        );
    }

    return options;
};
