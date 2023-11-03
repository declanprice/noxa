import { Command } from './command.type';
import { BusMessage } from '../../bus';
import { StoreSession } from '../../store';
import { Session } from '../../store/session/store-session.service';
import { Inject } from '@nestjs/common';

export abstract class HandleCommand {
    session!: Session;

    constructor(
        @Inject(StoreSession) public readonly storeSession: StoreSession,
    ) {}

    abstract handle(command: Command, busMessage?: BusMessage): Promise<void>;
}
