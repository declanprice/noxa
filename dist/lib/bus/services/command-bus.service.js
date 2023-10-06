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
const tokens_1 = require("../../tokens");
const outbox_service_1 = require("./outbox.service");
let CommandBus = CommandBus_1 = class CommandBus {
    constructor(busImpl, config, outbox, moduleRef) {
        this.busImpl = busImpl;
        this.config = config;
        this.outbox = outbox;
        this.moduleRef = moduleRef;
        this.handlers = new Map();
        this.logger = new common_1.Logger(CommandBus_1.name);
    }
    invoke(command) {
        const commandId = this.getCommandId(command);
        const handler = this.handlers.get(commandId);
        if (!handler) {
            const commandName = this.getCommandName(command);
            throw new Error(`command handler not found for ${commandName}`);
        }
        return handler.handle(command);
    }
    async publish(command, options) {
        const { toContext, tenantId, publishAt } = options;
        await this.outbox.publish({
            bus: 'command',
            type: this.getCommandName(command),
            fromContext: toContext ? toContext : this.config.context,
            tenantId: tenantId ? tenantId : 'DEFAULT',
            timestamp: publishAt ? publishAt.toISOString() : new Date().toISOString(),
            data: command,
        });
    }
    async send(command, options) {
        const { toContext, tenantId, publishAt } = options || {};
        await this.busImpl.sendCommand({
            bus: 'command',
            type: this.getCommandName(command),
            fromContext: toContext ? toContext : this.config.context,
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
        const instance = this.moduleRef.get(handler, { strict: false });
        if (!instance) {
            return;
        }
        const target = this.reflectCommandId(handler);
        if (!target) {
            throw new Error('invalid command handler');
        }
        this.handlers.set(target, instance);
        await this.busImpl.registerCommandHandler(instance);
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
    reflectCommandId(handler) {
        const command = Reflect.getMetadata(constants_1.COMMAND_HANDLER_METADATA, handler);
        const commandMetadata = Reflect.getMetadata(constants_1.COMMAND_METADATA, command);
        return commandMetadata.id;
    }
};
exports.CommandBus = CommandBus;
exports.CommandBus = CommandBus = CommandBus_1 = __decorate([
    (0, common_1.Injectable)({}),
    __param(0, (0, tokens_1.InjectNoxaBus)()),
    __param(1, (0, tokens_1.InjectNoxaConfig)()),
    __metadata("design:paramtypes", [Object, Object, outbox_service_1.Outbox,
        core_1.ModuleRef])
], CommandBus);
