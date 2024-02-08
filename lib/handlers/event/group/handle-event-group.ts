import { getEventGroupHandler } from './event-group.decorator';
import { GroupCannotHandleEventTypeError } from '../../../bus/services/errors/group-cannot-handle-event-type.error';
import { EventMessage } from '../event.type';

export abstract class HandleEventGroup {
    async handle(message: EventMessage<any>): Promise<void> {
        const handler = getEventGroupHandler(this.constructor, message.type);

        if (!handler) {
            throw new GroupCannotHandleEventTypeError(
                this.constructor.name,
                message.type,
            );
        }

        const eventMessage: EventMessage<any> = {
            type: message.type,
            data: message.data,
        };

        await (this as any)[handler](eventMessage);
    }
}
