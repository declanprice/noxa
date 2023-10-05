"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const lib_1 = require("../lib");
const nestjs_pino_1 = require("nestjs-pino");
const register_customer_handler_1 = require("./register-customer.handler");
let ApplicationModule = class ApplicationModule {
};
exports.ApplicationModule = ApplicationModule;
exports.ApplicationModule = ApplicationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    transport: {
                        target: 'pino-pretty',
                        options: {
                            levelFirst: true,
                            colorize: true,
                            ignore: 'pid,res',
                        },
                    },
                },
            }),
            lib_1.NoxaModule.forRoot({
                context: 'customer',
                postgresConnectionUrl: '',
                bus: new lib_1.RabbitmqBus(''),
                autoCreateResources: true,
                asyncDaemon: {
                    enabled: true,
                },
            }),
        ],
        controllers: [app_controller_1.AppController],
        providers: [register_customer_handler_1.RegisterCustomerHandler],
    })
], ApplicationModule);
