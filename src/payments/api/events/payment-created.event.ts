export class PaymentCreatedEvent {
    constructor(
        readonly paymentId: string,
        readonly orderId: string,
        readonly amount: number,
    ) {}
}
