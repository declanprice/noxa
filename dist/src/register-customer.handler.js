"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterCustomerHandler = exports.RegisterCustomer = void 0;
const lib_1 = require("../lib");
class RegisterCustomer {
    constructor(customerId, name) {
        this.customerId = customerId;
        this.name = name;
    }
}
exports.RegisterCustomer = RegisterCustomer;
let RegisterCustomerHandler = class RegisterCustomerHandler {
    async handle(command) {
        console.log('command was executed', command);
    }
};
exports.RegisterCustomerHandler = RegisterCustomerHandler;
exports.RegisterCustomerHandler = RegisterCustomerHandler = __decorate([
    (0, lib_1.CommandHandler)(RegisterCustomer)
], RegisterCustomerHandler);
