import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { ShipmentStream } from './shipment.stream';
import { DispatchShipmentCommand } from '../api/commands/dispatch-shipment.command';
import { ShipmentDispatchedEvent } from '../api/events/shipment-dispatched.event';

@CommandHandler(DispatchShipmentCommand)
export class DispatchShipmentHandler extends HandleCommand {
    async handle(command: DispatchShipmentCommand, session: DatabaseSession) {
        await session.eventStore.startStream(
            ShipmentStream,
            command.shipmentId,
            new ShipmentDispatchedEvent(
                command.shipmentId,
                command.orderId,
                command.addressLine1,
                command.addressLine2,
                command.city,
                command.postcode,
            ),
        );
    }
}
