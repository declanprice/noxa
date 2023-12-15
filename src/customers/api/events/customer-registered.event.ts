export class CustomerRegistered {
    constructor(
        readonly customerId: string,
        readonly firstName: string,
        readonly lastName: string,
        readonly email: string,
    ) {}
}
