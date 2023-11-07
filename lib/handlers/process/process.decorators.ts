import { Type } from '@nestjs/common';
import { Event } from '../index';

export const PROCESS_HANDLER_METADATA = 'PROCESS_HANDLER_METADATA';

export const PROCESS_HANDLER_OPTIONS_METADATA =
    'PROCESS_HANDLER_OPTIONS_METADATA';

export const PROCESS_HANDLER_DOCUMENT_METADATA =
    'PROCESS_HANDLER_DOCUMENT_METADATA';

export const PROCESS_FIELDS_METADATA = 'PROCESS_FIELDS_METADATA';

export const PROCESS_EVENT_TYPES_METADATA = 'PROCESS_EVENT_TYPES_METADATA';

export type ProcessOptionsMetadata = {
    consumerType: any;
};

export type ProcessHandlerMetadata<E extends Event> = {
    propertyKey: string;
    associationId: (event: E) => string;
    start?: boolean;
};

export const Process = (
    document: Type,
    options: ProcessOptionsMetadata,
): ClassDecorator => {
    return (target: object) => {
        Reflect.defineMetadata(
            PROCESS_HANDLER_DOCUMENT_METADATA,
            document,
            target,
        );
        Reflect.defineMetadata(
            PROCESS_HANDLER_OPTIONS_METADATA,
            options,
            target,
        );
        Reflect.defineMetadata(PROCESS_HANDLER_METADATA, options, target);
    };
};

export const ProcessEventHandler = <E extends Event>(options: {
    event: Type<E>;
    associationId: (event: E) => string;
    start?: boolean;
}): MethodDecorator => {
    return (target: object, propertyKey: string | symbol) => {
        const { event, associationId, start } = options;

        const eventType = event.name;

        let eventTypes = Reflect.getMetadata(
            PROCESS_EVENT_TYPES_METADATA,
            target.constructor,
        ) as Set<string> | undefined;

        if (eventTypes) {
            eventTypes.add(eventType);
        } else {
            eventTypes = new Set();
            eventTypes.add(eventType);
        }

        Reflect.defineMetadata(
            PROCESS_EVENT_TYPES_METADATA,
            eventTypes,
            target.constructor,
        );

        const handlerMetadata: ProcessHandlerMetadata<E> = {
            propertyKey: propertyKey as string,
            associationId,
            start,
        };

        Reflect.defineMetadata(eventType, handlerMetadata, target.constructor);
    };
};

export const getProcessOptionMetadata = (
    process: Type,
): ProcessOptionsMetadata => {
    const options = Reflect.getMetadata(PROCESS_HANDLER_METADATA, process);

    if (!options) {
        throw new Error(`process ${process} has no @Process decorator`);
    }

    return options;
};

export const getProcessDocumentMetadata = (process: Type): Type => {
    const document = Reflect.getMetadata(
        PROCESS_HANDLER_DOCUMENT_METADATA,
        process,
    );

    if (!document) {
        throw new Error(`process ${process} has no document type metadata.`);
    }

    return document;
};

export const getProcessEventTypesMetadata = (process: Type): Set<string> => {
    const eventTypes = Reflect.getMetadata(
        PROCESS_EVENT_TYPES_METADATA,
        process,
    );

    if (!eventTypes) {
        throw new Error(
            `process ${process} has no @ProcessEventHandler decorators`,
        );
    }

    return eventTypes;
};

export const getProcessEventHandlerMetadata = <E extends Event>(
    process: any,
    eventType: string,
): ProcessHandlerMetadata<E> => {
    const handlerMetadata = Reflect.getMetadata(
        eventType,
        process,
    ) as ProcessHandlerMetadata<E>;

    if (!handlerMetadata) {
        throw new Error(
            `process ${process} has no @ProcessEventHandler for event type ${eventType}`,
        );
    }

    return handlerMetadata;
};
