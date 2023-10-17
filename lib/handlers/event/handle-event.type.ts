import { Event } from './event.type';
import { BusMessage } from '../../bus';

export type HandleEvent<TEvent extends Event = any, TResult = any> = {
  handle(event: TEvent, busMessage?: BusMessage): Promise<TResult>;
};
