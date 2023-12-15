export class ShipmentDeliveredEvent {
    constructor(
        readonly shipmentId: string,
        readonly orderId: string,
    ) {}
}
