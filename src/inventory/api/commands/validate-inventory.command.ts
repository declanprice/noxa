type ValidateInventoryItem = {
    inventoryId: string;
    quantity: number;
};

export class ValidateInventoryCommand {
    constructor(
        readonly orderId: string,
        readonly inventory: ValidateInventoryItem[],
    ) {}
}
