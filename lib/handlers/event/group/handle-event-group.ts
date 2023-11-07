import { Inject } from '@nestjs/common';

import { StoreSession } from '../../../store';
import { Session } from '../../../store/session/store-session.service';
import { BusMessage } from '../../../bus';
import { getEventGroupHandler } from './event-group.decorator';
import { GroupCannotHandleEventTypeError } from '../../../bus/services/errors/group-cannot-handle-event-type.error';

export abstract class HandleEventGroup {
    session!: Session;

    constructor(
        @Inject(StoreSession) public readonly storeSession: StoreSession,
    ) {}

    async handle(message: BusMessage): Promise<void> {
        const handler = getEventGroupHandler(this.constructor, message.type);

        if (!handler) {
            throw new GroupCannotHandleEventTypeError(
                this.constructor.name,
                message.type,
            );
        }

        // this.session = await this.storeSession.start();

        // try {
        await (this as any)[handler](message.data);
        //     await this.session.commit();
        // } catch (error) {
        //     await this.session.rollback();
        //     throw error;
        // } finally {
        //     this.session.release();
        // }
    }
}
