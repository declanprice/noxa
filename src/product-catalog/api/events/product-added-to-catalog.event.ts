export class ProductAddedToCatalog {
    constructor(
        readonly productId: string,
        readonly inventoryId: string,
        readonly name: string,
        readonly description: string,
        readonly price: number,
        readonly category: string,
        readonly photoUrl: string | null,
    ) {}
}
