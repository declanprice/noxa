type ProductOrderItem = {
    productId: string;
    inventoryId: string;
    price: number;
};

export class ValidateProductsCommand {
    constructor(
        readonly orderId: string,
        readonly products: ProductOrderItem[],
    ) {}
}
