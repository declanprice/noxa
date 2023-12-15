export class StockInventoryCommand {
    constructor(
        readonly inventoryId: string,
        readonly quantity: number,
    ) {}
}
