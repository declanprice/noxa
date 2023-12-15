export class PaymentCapturedEvent {
    constructor(
        readonly paymentId: string,
        readonly orderId: string,
        readonly amount: number,
    ) {}
}
