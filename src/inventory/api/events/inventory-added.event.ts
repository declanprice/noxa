export class InventoryAddedEvent {
    constructor(
        readonly inventoryId: string,
        readonly name: string,
        readonly quantity: number,
    ) {}
}
