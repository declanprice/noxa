export class AddInventoryCommand {
    constructor(
        readonly inventoryId: string,
        readonly name: string,
        readonly quantity: number,
    ) {}
}
