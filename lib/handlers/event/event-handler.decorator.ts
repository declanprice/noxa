import { Event } from './event.type';

export const EVENT_HANDLER_METADATA = 'EVENT_HANDLER_METADATA';

export const EVENT_HANDLER_OPTIONS_METADATA = 'EVENT_HANDLER_OPTIONS_METADATA';

export type EventHandlerOptions = {
  consumerType?: any;
  group?: string;
};

export const EventHandler = (
  event: Event | (new (...args: any[]) => Event),
  options?: EventHandlerOptions,
): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(EVENT_HANDLER_OPTIONS_METADATA, options, target);
    Reflect.defineMetadata(EVENT_HANDLER_METADATA, event, target);
  };
};
