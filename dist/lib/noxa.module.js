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
let NoxaModule = NoxaModule_1 = class NoxaModule {
    constructor(handlerExplorer, commandBus) {
        this.handlerExplorer = handlerExplorer;
        this.commandBus = commandBus;
    }
    static forRoot(options) {
        return {
            module: NoxaModule_1,
            providers: [
                {
                    provide: 'NOXA_BUS_IMPL',
                    useValue: options.bus,
                },
            ],
            global: true,
        };
    }
    onApplicationBootstrap() {
        const { commandHandlers } = this.handlerExplorer.explore();
        this.commandBus.register(commandHandlers);
    }
};
exports.NoxaModule = NoxaModule;
exports.NoxaModule = NoxaModule = NoxaModule_1 = __decorate([
    (0, common_1.Module)({
        exports: [bus_1.CommandBus],
        providers: [bus_1.CommandBus, handlers_1.HandlerExplorer],
    }),
    __metadata("design:paramtypes", [handlers_1.HandlerExplorer,
        bus_1.CommandBus])
], NoxaModule);
