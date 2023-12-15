import { DataProjection, ProjectionEventHandler } from '../../../lib';
import { Shipment, shipments } from '../../schema';
import { ShipmentDispatchedEvent } from '../api/events/shipment-dispatched.event';
import { ShippingStatus } from '../api/commands/shipping-status.enum';
import { ShipmentDeliveredEvent } from '../api/events/shipment-delivered.event';

@DataProjection(shipments)
export class ShipmentProjection {
    @ProjectionEventHandler(ShipmentDispatchedEvent, (e) => e.id)
    onDispatched(event: ShipmentDispatchedEvent): Shipment {
        return {
            id: event.id,
            customerId: event.customerId,
            orderId: event.orderId,
            dateShipped: event.dateShipped,
            addressLine1: event.addressLine1,
            addressLine2: event.addressLine2,
            postcode: event.postcode,
            city: event.city,
            status: ShippingStatus.DISPATCHED,
        };
    }

    @ProjectionEventHandler(ShipmentDeliveredEvent, (e) => e.id)
    onDelivered(event: ShipmentDeliveredEvent, existing: Shipment): Shipment {
        return {
            ...existing,
            status: ShippingStatus.DELIVERED,
        };
    }
}
