export class AddProductToCatalog {
    constructor(
        readonly inventoryId: string,
        readonly name: string,
        readonly description: string,
        readonly price: number,
        readonly category: string,
        readonly photoUrl: string | null,
    ) {}
}
