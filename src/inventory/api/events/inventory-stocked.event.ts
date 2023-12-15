export class InventoryStockedEvent {
    constructor(
        readonly inventoryId: string,
        readonly quantity: number,
    ) {}
}
