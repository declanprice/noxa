import { Stream, StreamEventHandler } from '../../../lib';
import { InventoryStockedEvent } from '../api/events/inventory-stocked.event';
import { InventoryAddedEvent } from '../api/events/inventory-added.event';
import { InventoryUnStockedEvent } from '../api/events/inventory-unstocked.event';

@Stream()
export class InventoryStream {
    inventoryId: string;
    name: string;
    quantityAvailable: number;

    @StreamEventHandler(InventoryAddedEvent)
    onAdded(event: InventoryAddedEvent) {
        this.inventoryId = event.inventoryId;
        this.name = event.name;
        this.quantityAvailable = event.quantity;
    }

    @StreamEventHandler(InventoryStockedEvent)
    onStocked(event: InventoryStockedEvent) {
        this.quantityAvailable += event.quantity;
    }

    @StreamEventHandler(InventoryUnStockedEvent)
    onUnStocked(event: InventoryUnStockedEvent) {
        this.quantityAvailable -= event.quantity;
    }
}
