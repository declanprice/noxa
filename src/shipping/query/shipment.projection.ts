import { DataProjection, ProjectionEventHandler } from '../../../lib';
import { Shipment, shipmentsTable } from '../../schema';
import { ShipmentDispatchedEvent } from '../api/events/shipment-dispatched.event';
import { ShippingStatus } from '../api/commands/shipping-status.enum';
import { ShipmentDeliveredEvent } from '../api/events/shipment-delivered.event';

@DataProjection(shipmentsTable)
export class ShipmentProjection {
    @ProjectionEventHandler(ShipmentDispatchedEvent, (e) => e.shipmentId)
    onDispatched(event: ShipmentDispatchedEvent): Shipment {
        return {
            id: event.shipmentId,
            orderId: event.orderId,
            addressLine1: event.addressLine1,
            addressLine2: event.addressLine2,
            postcode: event.postcode,
            city: event.city,
            status: ShippingStatus.DISPATCHED,
        };
    }

    @ProjectionEventHandler(ShipmentDeliveredEvent, (e) => e.shipmentId)
    onDelivered(event: ShipmentDeliveredEvent, existing: Shipment): Shipment {
        return {
            ...existing,
            status: ShippingStatus.DELIVERED,
        };
    }
}
