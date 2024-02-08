import { Event } from './event.type';

export abstract class HandleEvent {
    abstract handle(command: Event): Promise<void>;
}
