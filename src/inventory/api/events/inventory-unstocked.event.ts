export class InventoryUnStockedEvent {
    constructor(
        readonly inventoryId: string,
        readonly quantity: number,
    ) {}
}
