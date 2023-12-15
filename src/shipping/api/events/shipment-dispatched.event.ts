export class ShipmentDispatchedEvent {
    constructor(
        readonly shipmentId: string,
        readonly orderId: string,
        readonly addressLine1: string,
        readonly addressLine2: string,
        readonly city: string,
        readonly postcode: string,
    ) {}
}
