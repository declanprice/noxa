import { Stream, StreamHandler } from '../../lib';

export class OrderPlacedEvent {
    constructor(
        readonly orderId: string,
        readonly items: string[],
        readonly customerId: string,
    ) {}
}

@Stream({
    snapshotPeriod: 10,
})
export class OrderStream {
    orderId: string;
    customerId: string;

    @StreamHandler(OrderPlacedEvent)
    onCreated(event: OrderPlacedEvent) {
        this.orderId = event.orderId;
        this.customerId = event.customerId;
    }
}
