export class SetInventoryQuantityCommand {
    constructor(
        readonly inventoryId: string,
        readonly quantity: number,
    ) {}
}
