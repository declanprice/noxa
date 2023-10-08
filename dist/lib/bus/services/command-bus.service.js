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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CommandBus_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandBus = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const constants_1 = require("../../handlers/constants");
const bus_relay_type_1 = require("../bus-relay.type");
const config_1 = require("../../config");
let CommandBus = CommandBus_1 = class CommandBus {
    constructor(busRelay, config, moduleRef) {
        this.busRelay = busRelay;
        this.config = config;
        this.moduleRef = moduleRef;
        this.handlers = new Map();
        this.logger = new common_1.Logger(CommandBus_1.name);
    }
    async invoke(command) {
        const commandId = this.getCommandId(command);
        const handler = this.handlers.get(commandId);
        if (!handler) {
            const commandName = this.getCommandName(command);
            throw new Error(`command handler not found for ${commandName}`);
        }
        return await handler.handle(command);
    }
    async sendCommand(command, options) {
        const { toContext, tenantId, publishAt } = options || {};
        await this.busRelay.sendCommand({
            bus: 'command',
            type: this.getCommandName(command),
            fromContext: this.config.context,
            targetContext: toContext ? toContext : this.config.context,
            tenantId: tenantId ? tenantId : 'DEFAULT',
            timestamp: publishAt ? publishAt.toISOString() : new Date().toISOString(),
            data: command,
        });
    }
    async register(handlers = []) {
        for (const handler of handlers) {
            await this.registerHandler(handler);
        }
    }
    async registerHandler(handler) {
        const { id, type } = this.reflectCommandHandler(handler);
        if (!id) {
            throw new Error('invalid command handler');
        }
        const instance = this.moduleRef.get(handler, { strict: false });
        if (!instance) {
            return;
        }
        this.handlers.set(id, instance);
        await this.busRelay.registerCommandHandler(instance, {
            type,
        });
    }
    getCommandName(command) {
        const { constructor } = Object.getPrototypeOf(command);
        return constructor.name;
    }
    getCommandId(command) {
        const { constructor: commandType } = Object.getPrototypeOf(command);
        const commandMetadata = Reflect.getMetadata(constants_1.COMMAND_METADATA, commandType);
        if (!commandMetadata) {
            throw new Error('command handler not found');
        }
        return commandMetadata.id;
    }
    reflectCommandHandler(handler) {
        const command = Reflect.getMetadata(constants_1.COMMAND_HANDLER_METADATA, handler);
        const commandMetadata = Reflect.getMetadata(constants_1.COMMAND_METADATA, command);
        if (!command || !commandMetadata) {
            throw new Error(`reflect data not found for handler ${handler.constructor.name}`);
        }
        return {
            id: commandMetadata.id,
            type: commandMetadata.type,
        };
    }
};
exports.CommandBus = CommandBus;
exports.CommandBus = CommandBus = CommandBus_1 = __decorate([
    (0, common_1.Injectable)({}),
    __param(0, (0, bus_relay_type_1.InjectBusRelay)()),
    __param(1, (0, config_1.InjectConfig)()),
    __metadata("design:paramtypes", [Object, Object, core_1.ModuleRef])
], CommandBus);
