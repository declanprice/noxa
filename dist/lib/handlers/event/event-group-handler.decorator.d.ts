import { EventConsumerType } from './event-consumer-type.enum';
export type EventGroupHandlerOptions = {
    consumerType: EventConsumerType;
};
export declare const EventGroupHandler: (options: EventGroupHandlerOptions) => ClassDecorator;
