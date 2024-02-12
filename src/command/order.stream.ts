import { Stream, StreamHandler } from '../../lib';

export class OrderPlacedEvent {
    constructor(
        readonly orderId: string,
        readonly items: string[],
        readonly customerId: string,
    ) {}
}

export class OrderAcceptedEvent {
    constructor(readonly orderId: string) {}
}

@Stream({
    snapshotPeriod: 10,
})
export class OrderStream {
    orderId: string;
    customerId: string;
    status: 'placed' | 'accepted';

    @StreamHandler(OrderPlacedEvent)
    onCreated(event: OrderPlacedEvent) {
        this.orderId = event.orderId;
        this.customerId = event.customerId;
        this.status = 'placed';
    }

    @StreamHandler(OrderAcceptedEvent)
    onAccepted(event: OrderAcceptedEvent) {
        this.status = 'accepted';
    }
}
