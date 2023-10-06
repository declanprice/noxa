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
var NoxaModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoxaModule = void 0;
const common_1 = require("@nestjs/common");
const handlers_1 = require("./handlers");
const bus_1 = require("./bus");
const tokens_1 = require("./tokens/");
const outbox_service_1 = require("./bus/services/outbox.service");
const event_bus_service_1 = require("./bus/services/event-bus.service");
const query_bus_service_1 = require("./bus/services/query-bus.service");
let NoxaModule = NoxaModule_1 = class NoxaModule {
    constructor(handlerExplorer, commandBus, queryBus, eventBus) {
        this.handlerExplorer = handlerExplorer;
        this.commandBus = commandBus;
        this.queryBus = queryBus;
        this.eventBus = eventBus;
    }
    static forRoot(options) {
        return {
            module: NoxaModule_1,
            providers: [
                {
                    provide: tokens_1.NOXA_BUS_TOKEN,
                    useValue: options.bus,
                },
                {
                    provide: tokens_1.NOXA_CONFIG_TOKEN,
                    useValue: {
                        context: options.context,
                        asyncDaemon: options.asyncDaemon,
                    },
                },
            ],
            global: true,
        };
    }
    async onApplicationBootstrap() {
        const { commandHandlers, queryHandlers, eventHandlers } = this.handlerExplorer.explore();
        await this.commandBus.register(commandHandlers);
        await this.queryBus.register(queryHandlers);
        await this.eventBus.register(eventHandlers);
    }
};
exports.NoxaModule = NoxaModule;
exports.NoxaModule = NoxaModule = NoxaModule_1 = __decorate([
    (0, common_1.Module)({
        exports: [bus_1.CommandBus, query_bus_service_1.QueryBus, event_bus_service_1.EventBus, outbox_service_1.Outbox],
        providers: [bus_1.CommandBus, query_bus_service_1.QueryBus, event_bus_service_1.EventBus, outbox_service_1.Outbox, handlers_1.HandlerExplorer],
    }),
    __metadata("design:paramtypes", [handlers_1.HandlerExplorer,
        bus_1.CommandBus,
        query_bus_service_1.QueryBus,
        event_bus_service_1.EventBus])
], NoxaModule);
