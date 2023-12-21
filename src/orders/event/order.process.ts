import {
    HandleProcess,
    OutboxStore,
    Process,
    ProcessHandler,
    RabbitmqEventConsumerType,
} from '../../../lib';

import { OrderRequestedEvent } from '../api/events/order-requested.event';
import { ProcessSession } from '../../../lib/handlers/process/process.session';
import { ValidateProductsCommand } from '../../product-catalog/api/commands/validate-products.command';
import { ValidateInventoryCommand } from '../../inventory/api/commands/validate-inventory.command';
import { ProductsValidatedEvent } from '../../product-catalog/api/events/products-validated.event';
import { OrderLineItem } from '../api/commands/order-line-item.type';
import { InventoryValidationFailedEvent } from '../../inventory/api/events/inventory-validation-failed.event';
import { PaymentCapturedEvent } from '../../payments/api/events/payment-captured.event';
import { ShipmentDeliveredEvent } from '../../shipping/api/events/shipment-delivered.event';
import { OrderCompleteEvent } from '../api/events/order-complete.event';
import { ProductsValidationFailedEvent } from '../../product-catalog/api/events/products-validation-failed.event';
import { OrderCanceledEvent } from '../api/events/order-canceled.event';
import { CompleteOrderCommand } from '../api/commands/complete-order.command';
import { CapturePaymentCommand } from '../../payments/api/commands/capture-payment.command';
import { RefundPaymentCommand } from '../../payments/api/commands/refund-payment.command';
import { CancelOrderCommand } from '../api/commands/cancel-order.command';
import { InventoryValidationSuccessEvent } from '../../inventory/api/events/inventory-validation-success.event';
import { PlaceOrderCommand } from '../api/commands/place-order.command';

type OrderProcessData = {
    orderId: string;
    paymentId: string;
    customerId: string;
    lineItems: OrderLineItem[];
    paymentCaptured: boolean;
};

type OrderProcessSession = ProcessSession<OrderProcessData>;

@Process({
    consumerType: RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
    defaultAssociationKey: 'orderId',
})
export class OrderProcess extends HandleProcess {
    @ProcessHandler(OrderRequestedEvent, { start: true })
    async onOrderPlaced(
        event: OrderRequestedEvent,
        session: OrderProcessSession,
    ) {
        session.update({
            orderId: event.orderId,
            paymentId: event.paymentId,
            customerId: event.customerId,
            lineItems: event.lineItems,
            paymentCaptured: false,
        });

        await session.outboxStore.publishCommand(
            new ValidateProductsCommand(
                event.orderId,
                event.lineItems.map((i) => ({
                    productId: i.productId,
                    inventoryId: i.inventoryId,
                    price: i.price,
                })),
            ),
        );
    }

    @ProcessHandler(ProductsValidatedEvent)
    async onProductsValidated(
        event: ProductsValidatedEvent,
        session: OrderProcessSession,
    ) {
        await session.outboxStore.publishCommand(
            new ValidateInventoryCommand(
                event.orderId,
                session.data.lineItems.map((i) => ({
                    inventoryId: i.inventoryId,
                    quantity: i.quantity,
                })),
            ),
        );
    }

    @ProcessHandler(InventoryValidationSuccessEvent)
    async onInventoryReserved(
        event: InventoryValidationSuccessEvent,
        session: OrderProcessSession,
    ) {
        await session.outboxStore.publishCommand(
            new CapturePaymentCommand(event.orderId),
        );
    }

    @ProcessHandler(PaymentCapturedEvent)
    async onPaymentCaptured(
        event: PaymentCapturedEvent,
        session: OrderProcessSession,
    ) {
        session.update({
            paymentCaptured: true,
        });

        await session.outboxStore.publishCommand(
            new PlaceOrderCommand(event.orderId),
        );
    }

    @ProcessHandler(ShipmentDeliveredEvent)
    async onShipmentDelivered(
        event: ShipmentDeliveredEvent,
        session: OrderProcessSession,
    ) {
        await session.outboxStore.publishCommand(
            new CompleteOrderCommand(event.orderId),
        );
    }

    @ProcessHandler(OrderCompleteEvent)
    async onComplete(event: OrderCompleteEvent, session: OrderProcessSession) {
        session.end();
    }

    /**
     *  Compensation Handlers
     */
    @ProcessHandler([
        ProductsValidationFailedEvent,
        InventoryValidationFailedEvent,
    ])
    async onFail(event: any, session: OrderProcessSession) {
        await session.outboxStore.publishCommand(
            new CancelOrderCommand(event.orderId),
        );
    }

    @ProcessHandler(OrderCanceledEvent)
    async onCancel(event: any, session: OrderProcessSession) {
        if (session.data.paymentCaptured) {
            await session.outboxStore.publishCommand(
                new RefundPaymentCommand(session.data.paymentId),
            );
        }

        session.end();
    }
}
