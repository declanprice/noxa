"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterCustomerHandler = exports.CustomerDocument = exports.CustomerStream = exports.CustomerNameChangedEvent = exports.CustomerRegisteredEvent = exports.RegisterCustomer = void 0;
const lib_1 = require("../lib");
class RegisterCustomer {
    constructor(customerId, name) {
        this.customerId = customerId;
        this.name = name;
    }
}
exports.RegisterCustomer = RegisterCustomer;
class CustomerRegisteredEvent {
    constructor(customerId, name) {
        this.customerId = customerId;
        this.name = name;
    }
}
exports.CustomerRegisteredEvent = CustomerRegisteredEvent;
class CustomerNameChangedEvent {
    constructor(customerId, name) {
        this.customerId = customerId;
        this.name = name;
    }
}
exports.CustomerNameChangedEvent = CustomerNameChangedEvent;
let CustomerStream = class CustomerStream {
    onCustomerRegistered(event) {
        console.log('event handler called with event', event);
        this.customerId = event.customerId;
        this.name = event.name;
    }
    onCustomerNameChanged(event) {
        this.name = event.name;
    }
};
exports.CustomerStream = CustomerStream;
__decorate([
    (0, lib_1.EventStreamHandler)(CustomerRegisteredEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CustomerRegisteredEvent]),
    __metadata("design:returntype", void 0)
], CustomerStream.prototype, "onCustomerRegistered", null);
__decorate([
    (0, lib_1.EventStreamHandler)(CustomerNameChangedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CustomerNameChangedEvent]),
    __metadata("design:returntype", void 0)
], CustomerStream.prototype, "onCustomerNameChanged", null);
exports.CustomerStream = CustomerStream = __decorate([
    (0, lib_1.EventStream)({
        snapshotPeriod: 10,
    })
], CustomerStream);
let CustomerDocument = class CustomerDocument {
    constructor(customerId, name) {
        this.customerId = customerId;
        this.name = name;
    }
};
exports.CustomerDocument = CustomerDocument;
__decorate([
    (0, lib_1.DocumentId)(),
    __metadata("design:type", String)
], CustomerDocument.prototype, "customerId", void 0);
exports.CustomerDocument = CustomerDocument = __decorate([
    (0, lib_1.Document)(),
    __metadata("design:paramtypes", [String, String])
], CustomerDocument);
let RegisterCustomerHandler = class RegisterCustomerHandler {
    constructor(session) {
        this.session = session;
    }
    async handle(command) {
        const session = await this.session.start();
        // const event = new CustomerNameChangedEvent(
        //   command.customerId,
        //   command.name,
        // );
        //
        // await session.event.appendEvent(CustomerStream, command.customerId, event);
        //
        // await session.outbox.publishEvent(event);
        // const customer = await session.event.hydrateStream(
        //   CustomerStream,
        //   'efac5b66-6744-41a9-8ad4-ffef4228a15b',
        // );
        // await session.event.startStream(
        //   CustomerStream,
        //   command.customerId,
        //   new CustomerRegisteredEvent(command.customerId, command.name),
        // );
        await session.commit();
    }
};
exports.RegisterCustomerHandler = RegisterCustomerHandler;
exports.RegisterCustomerHandler = RegisterCustomerHandler = __decorate([
    (0, lib_1.CommandHandler)(RegisterCustomer),
    __metadata("design:paramtypes", [lib_1.StoreSession])
], RegisterCustomerHandler);
