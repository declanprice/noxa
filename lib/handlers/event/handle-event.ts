import { Event } from './event.type';
import { DatabaseSession } from '../../store';

export abstract class HandleEvent {
    abstract handle(command: Event, session: DatabaseSession): Promise<void>;
}
