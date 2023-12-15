import { OrderLineItem } from '../commands/order-line-item.type';

export class OrderRequestedEvent {
    constructor(
        readonly orderId: string,
        readonly customerId: string,
        readonly paymentId: string,
        readonly lineItems: OrderLineItem[],
    ) {}
}
