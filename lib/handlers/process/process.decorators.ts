import { Type } from '@nestjs/common';
import { Event } from '../index';

export const PROCESS_METADATA = 'PROCESS_METADATA';
export const PROCESS_EVENTS_METADATA = 'PROCESS_EVENTS_METADATA';
export const PROCESS_HANDLER_METADATA = 'PROCESS_HANDLER_METADATA';

export type ProcessMetadata = {
    consumerType: any;
    defaultAssociationKey: string;
};

export type ProcessHandlerMetadata = {
    event: Type<Event>;
    method: string;
    associationKey?: string;
    start?: boolean;
};

export const Process = (options: ProcessMetadata): ClassDecorator => {
    return (target: object) => {
        Reflect.defineMetadata(PROCESS_METADATA, options, target);
    };
};

export const ProcessHandler = (
    events: Type<Event> | Type<Event>[],
    options?: {
        associationKey?: string;
        start?: boolean;
    },
): MethodDecorator => {
    const { associationKey, start } = options || {};

    return (target: object, propertyKey: string | symbol) => {
        const defineEventMetadata = (event: Type<Event>) => {
            const eventType = event.name;

            let eventTypes = Reflect.getMetadata(
                PROCESS_EVENTS_METADATA,
                target.constructor,
            ) as Set<string> | undefined;

            if (eventTypes) {
                eventTypes.add(eventType);
            } else {
                eventTypes = new Set();
                eventTypes.add(eventType);
            }

            Reflect.defineMetadata(
                PROCESS_EVENTS_METADATA,
                eventTypes,
                target.constructor,
            );

            const handlerMetadata: ProcessHandlerMetadata = {
                event,
                method: propertyKey as string,
                associationKey,
                start,
            };

            Reflect.defineMetadata(
                eventType,
                handlerMetadata,
                target.constructor,
            );
        };

        if (Array.isArray(events)) {
            for (const e of events) {
                defineEventMetadata(e);
            }
        } else {
            defineEventMetadata(events);
        }
    };
};

export const getProcessMetadata = (process: any): ProcessMetadata => {
    const options = Reflect.getMetadata(PROCESS_METADATA, process);

    if (!options) {
        throw new Error(`process ${process} has no @Process decorator`);
    }

    return options;
};

export const getProcessEventsMetadata = (process: any): Set<string> => {
    const eventTypes = Reflect.getMetadata(PROCESS_EVENTS_METADATA, process);

    if (!eventTypes) {
        throw new Error(`process ${process} has no @ProcessHandler decorators`);
    }

    return eventTypes;
};

export const getProcessHandlerMetadata = (
    process: any,
    eventType: string,
): ProcessHandlerMetadata => {
    const handlerMetadata = Reflect.getMetadata(
        eventType,
        process,
    ) as ProcessHandlerMetadata;

    if (!handlerMetadata) {
        throw new Error(
            `process ${process} has no @ProcessHandler for event type ${eventType}`,
        );
    }

    return handlerMetadata;
};
