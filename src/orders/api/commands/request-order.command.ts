import { OrderLineItem } from './order-line-item.type';

export class RequestOrderCommand {
    constructor(
        readonly orderId: string,
        readonly customerId: string,
        readonly paymentId: string,
        readonly lineItems: OrderLineItem[],
    ) {}
}
