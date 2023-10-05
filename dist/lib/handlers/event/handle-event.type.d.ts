import { Event } from './event.type';
export type HandleEvent<TEvent extends Event = any, TResult = any> = {
    handle(event: Event): Promise<TResult>;
};
