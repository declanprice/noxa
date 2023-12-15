import { BadRequestException } from '@nestjs/common';
import { CommandHandler, DatabaseSession, HandleCommand } from '../../../lib';
import { ShipmentStream } from './shipment.stream';
import { DeliverShipmentCommand } from '../api/commands/deliver-shipment.command';
import { ShippingStatus } from '../api/commands/shipping-status.enum';
import { ShipmentDeliveredEvent } from '../api/events/shipment-delivered.event';

@CommandHandler(DeliverShipmentCommand)
export class DeliverShipmentHandler extends HandleCommand {
    async handle(command: DeliverShipmentCommand, session: DatabaseSession) {
        const shipment = await session.eventStore.hydrateStream(
            ShipmentStream,
            command.shipmentId,
        );

        if (shipment.status !== ShippingStatus.DISPATCHED) {
            throw new BadRequestException(
                'order needs to be dispatched before it can be marked as delivered',
            );
        }

        await session.eventStore.appendEvent(
            ShipmentStream,
            command.shipmentId,
            new ShipmentDeliveredEvent(command.shipmentId, command.orderId),
        );
    }
}
