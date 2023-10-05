import { Event } from './event.type';
import { EventConsumerType } from './event-handler-consumer-type.enum';
export type EventHandlerOptions = {
    consumerType?: EventConsumerType;
    group?: string;
};
export declare const EventHandler: (event: Event | (new (...args: any[]) => Event), options?: EventHandlerOptions) => ClassDecorator;
