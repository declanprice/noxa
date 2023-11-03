import { Inject } from '@nestjs/common';
import {
    Session,
    StoreSession,
} from '../../store/session/store-session.service';
import { Event } from './event.type';
import { BusMessage } from '../../bus';

export abstract class HandleEvent {
    session!: Session;

    constructor(
        @Inject(StoreSession) public readonly storeSession: StoreSession,
    ) {}

    abstract handle(command: Event, busMessage?: BusMessage): Promise<void>;
}
