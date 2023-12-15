export class CreatePaymentCommand {
    constructor(
        readonly paymentId: string,
        readonly orderId: string,
        readonly amount: number,
    ) {}
}
