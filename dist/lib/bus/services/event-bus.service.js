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
var EventBus_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const constants_1 = require("../../handlers/constants");
const bus_relay_type_1 = require("../bus-relay.type");
const outbox_service_1 = require("./outbox.service");
const config_1 = require("../../config");
let EventBus = EventBus_1 = class EventBus {
    constructor(busRelay, config, outbox, moduleRef) {
        this.busRelay = busRelay;
        this.config = config;
        this.outbox = outbox;
        this.moduleRef = moduleRef;
        this.handlers = new Map();
        this.logger = new common_1.Logger(EventBus_1.name);
    }
    invoke(event) {
        const eventId = this.getEventId(event);
        const handler = this.handlers.get(eventId);
        if (!handler) {
            const eventName = this.getEventName(event);
            throw new Error(`event handler not found for ${eventName}`);
        }
        return handler.handle(event);
    }
    async sendEvent(event, options) {
        const { toContext, tenantId, publishAt } = options;
        await this.busRelay.sendCommand({
            bus: 'event',
            type: this.getEventName(event),
            fromContext: this.config.context,
            targetContext: toContext ? toContext : this.config.context,
            tenantId: tenantId ? tenantId : 'DEFAULT',
            timestamp: publishAt ? publishAt.toISOString() : new Date().toISOString(),
            data: event,
        });
    }
    async publish(event, options) {
        const { toContext, tenantId, publishAt } = options;
        await this.outbox.publish({
            bus: 'event',
            type: this.getEventName(event),
            fromContext: this.config.context,
            targetContext: toContext ? toContext : this.config.context,
            tenantId: tenantId ? tenantId : 'DEFAULT',
            timestamp: publishAt ? publishAt.toISOString() : new Date().toISOString(),
            data: event,
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
        const { id, type } = this.reflectEventHandler(handler);
        if (!id) {
            throw new Error('invalid event handler');
        }
        this.handlers.set(id, instance);
        await this.busRelay.registerEventHandler(instance, {
            type,
        });
    }
    getEventName(event) {
        const { constructor } = Object.getPrototypeOf(event);
        return constructor.name;
    }
    getEventId(event) {
        const { constructor: eventType } = Object.getPrototypeOf(event);
        const eventMetadata = Reflect.getMetadata(constants_1.EVENT_METADATA, eventType);
        if (!eventMetadata) {
            throw new Error(`event handler for event ${eventType} not found`);
        }
        return eventMetadata.id;
    }
    reflectEventHandler(handler) {
        const event = Reflect.getMetadata(constants_1.EVENT_HANDLER_METADATA, handler);
        const eventMetadata = Reflect.getMetadata(constants_1.EVENT_METADATA, event);
        if (!event || !eventMetadata) {
            throw new Error(`reflect data not found for handler ${handler.constructor.name}`);
        }
        return {
            id: eventMetadata.id,
            type: eventMetadata.type,
        };
    }
};
exports.EventBus = EventBus;
exports.EventBus = EventBus = EventBus_1 = __decorate([
    (0, common_1.Injectable)({}),
    __param(0, (0, bus_relay_type_1.InjectBusRelay)()),
    __param(1, (0, config_1.InjectConfig)()),
    __metadata("design:paramtypes", [Object, Object, outbox_service_1.Outbox,
        core_1.ModuleRef])
], EventBus);
