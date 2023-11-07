import { Session } from '../../store/session/store-session.service';
import { Event } from './event.type';
import { BusMessage } from '../../bus';

export abstract class HandleEvent {
    session!: Session;

    abstract handle(command: Event, busMessage?: BusMessage): Promise<void>;
}
