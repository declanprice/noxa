export class DeliverShipmentCommand {
    constructor(
        readonly shipmentId: string,
        readonly orderId: string,
    ) {}
}
