import { getEventGroupHandler } from './event-group.decorator';
import { GroupCannotHandleEventTypeError } from '../../../bus/services/errors/group-cannot-handle-event-type.error';
import { EventMessage } from '../event.type';
import { BusMessage } from '../../../bus';

export abstract class HandleEventGroup {
    async handle(message: EventMessage<any>): Promise<void> {
        const handler = getEventGroupHandler(this.constructor, message.type);

        if (!handler) {
            throw new GroupCannotHandleEventTypeError(
                this.constructor.name,
                message.type,
            );
        }

        await (this as any)[handler](message);
    }
}
