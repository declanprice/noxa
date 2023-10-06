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
var QueryBus_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBus = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const constants_1 = require("../../handlers/constants");
let QueryBus = QueryBus_1 = class QueryBus {
    constructor(moduleRef) {
        this.moduleRef = moduleRef;
        this.handlers = new Map();
        this.logger = new common_1.Logger(QueryBus_1.name);
    }
    invoke(query) {
        const queryId = this.getQueryId(query);
        const handler = this.handlers.get(queryId);
        if (!handler) {
            const queryName = this.getQueryName(query);
            throw new Error(`query handler not found for ${queryName}`);
        }
        return handler.handle(query);
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
        const target = this.reflectQueryId(handler);
        if (!target) {
            throw new Error('invalid query handler');
        }
        this.handlers.set(target, instance);
    }
    getQueryName(query) {
        const { constructor } = Object.getPrototypeOf(query);
        return constructor.name;
    }
    getQueryId(query) {
        const { constructor: queryType } = Object.getPrototypeOf(query);
        const queryMetaData = Reflect.getMetadata(constants_1.QUERY_METADATA, queryType);
        if (!queryMetaData) {
            throw new Error('query handler not found');
        }
        return queryMetaData.id;
    }
    reflectQueryId(handler) {
        const query = Reflect.getMetadata(constants_1.QUERY_HANDLER_METADATA, handler);
        const queryMetadata = Reflect.getMetadata(constants_1.QUERY_METADATA, query);
        return queryMetadata.id;
    }
};
exports.QueryBus = QueryBus;
exports.QueryBus = QueryBus = QueryBus_1 = __decorate([
    (0, common_1.Injectable)({}),
    __metadata("design:paramtypes", [core_1.ModuleRef])
], QueryBus);
