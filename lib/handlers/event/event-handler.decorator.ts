import { Event } from './event.type';
import { v4 } from 'uuid';
import {
  EVENT_HANDLER_METADATA,
  EVENT_HANDLER_OPTIONS_METADATA,
  EVENT_METADATA,
} from '../constants';
import { EventConsumerType } from './event-handler-consumer-type.enum';

export type EventHandlerOptions = {
  consumerType?: EventConsumerType;
  group?: string;
};

export const EventHandler = (
  event: Event | (new (...args: any[]) => Event),
  options?: EventHandlerOptions,
): ClassDecorator => {
  return (target: object) => {
    if (!Reflect.hasOwnMetadata(EVENT_METADATA, event)) {
      Reflect.defineMetadata(EVENT_METADATA, { id: v4() }, event);
    }

    Reflect.defineMetadata(EVENT_HANDLER_OPTIONS_METADATA, options, target);
    Reflect.defineMetadata(EVENT_HANDLER_METADATA, event, target);
  };
};
