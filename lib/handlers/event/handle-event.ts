import { EventMessage } from './event.type';

export abstract class HandleEvent {
    abstract handle(command: EventMessage<any>): Promise<void>;
}
