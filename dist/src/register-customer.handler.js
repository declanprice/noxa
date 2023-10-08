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
exports.RegisterCustomerHandler = exports.RegisterCustomer = void 0;
const lib_1 = require("../lib");
const store_1 = require("../lib/store");
class RegisterCustomer {
    constructor(customerId, name) {
        this.customerId = customerId;
        this.name = name;
    }
}
exports.RegisterCustomer = RegisterCustomer;
let RegisterCustomerHandler = class RegisterCustomerHandler {
    constructor(storeSession) {
        this.storeSession = storeSession;
    }
    async handle(command) {
        const session = await this.storeSession.start();
        await session.document.store();
        await session.commit();
    }
};
exports.RegisterCustomerHandler = RegisterCustomerHandler;
exports.RegisterCustomerHandler = RegisterCustomerHandler = __decorate([
    (0, lib_1.CommandHandler)(RegisterCustomer),
    __metadata("design:paramtypes", [store_1.StoreSession])
], RegisterCustomerHandler);
