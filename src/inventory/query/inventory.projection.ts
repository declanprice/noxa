import { DataProjection, ProjectionEventHandler } from '../../../lib';
import { inventory, Inventory } from '../../schema';
import { InventoryAddedEvent } from '../api/events/inventory-added.event';
import { InventoryStockedEvent } from '../api/events/inventory-stocked.event';
import { InventoryUnStockedEvent } from '../api/events/inventory-unstocked.event';

@DataProjection(inventory)
export class InventoryProjection {
    @ProjectionEventHandler(InventoryAddedEvent, (e) => e.inventoryId)
    onAdded(event: InventoryAddedEvent): Inventory {
        return {
            id: event.inventoryId,
            name: event.name,
            quantityAvailable: event.quantity,
        };
    }

    @ProjectionEventHandler(InventoryStockedEvent, (e) => e.inventoryId)
    onStocked(event: InventoryStockedEvent, existing: Inventory): Inventory {
        return {
            ...existing,
            quantityAvailable: existing.quantityAvailable + event.quantity,
        };
    }

    @ProjectionEventHandler(InventoryUnStockedEvent, (e) => e.inventoryId)
    onUnStocked(
        event: InventoryUnStockedEvent,
        existing: Inventory,
    ): Inventory {
        return {
            ...existing,
            quantityAvailable: existing.quantityAvailable - event.quantity,
        };
    }
}
