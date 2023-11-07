import { ChangeCustomerName, CustomerNameChanged } from '../customer.stream';

import { CommandHandler, HandleCommand } from '../../../lib';

@CommandHandler(ChangeCustomerName)
export class ChangeCustomerNameHandler extends HandleCommand {
    async handle(command: ChangeCustomerName) {
        const event = new CustomerNameChanged(command.customerId, command.name);

        // await this.session.event.appendEvent(
        //     CustomerStream,
        //     command.customerId,
        //     event,
        // );
        //
        // await this.session.outbox.publishEvent(event);
    }
}
