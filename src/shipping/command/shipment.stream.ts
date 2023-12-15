import { Stream, StreamEventHandler } from '../../../lib';
import { ShipmentDispatchedEvent } from '../api/events/shipment-dispatched.event';
import { ShipmentDeliveredEvent } from '../api/events/shipment-delivered.event';
import { ShippingStatus } from '../api/commands/shipping-status.enum';

@Stream()
export class ShipmentStream {
    shipmentId: string;
    orderId: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    postcode: string;
    status: ShippingStatus;

    @StreamEventHandler(ShipmentDispatchedEvent)
    onRegistered(event: ShipmentDispatchedEvent) {
        this.shipmentId = event.shipmentId;
        this.orderId = event.orderId;
        this.addressLine1 = event.addressLine1;
        this.addressLine2 = event.addressLine2;
        this.city = event.city;
        this.postcode = event.postcode;
        this.status = ShippingStatus.DISPATCHED;
    }

    @StreamEventHandler(ShipmentDeliveredEvent)
    onDelivered(event: ShipmentDeliveredEvent) {
        this.status = ShippingStatus.DELIVERED;
    }
}
