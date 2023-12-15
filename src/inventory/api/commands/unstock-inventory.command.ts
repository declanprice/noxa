export class UnStockInventoryCommand {
    constructor(
        readonly inventoryId: string,
        readonly quantity: number,
    ) {}
}
