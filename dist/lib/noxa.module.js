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
var NoxaModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoxaModule = void 0;
const common_1 = require("@nestjs/common");
const handlers_1 = require("./handlers");
const bus_1 = require("./bus");
const config_1 = require("./config");
const store_1 = require("./store");
const pg_1 = require("pg");
let NoxaModule = NoxaModule_1 = class NoxaModule {
    constructor(handlerExplorer, commandBus, queryBus, eventBus, busRelay, config, pool) {
        this.handlerExplorer = handlerExplorer;
        this.commandBus = commandBus;
        this.queryBus = queryBus;
        this.eventBus = eventBus;
        this.busRelay = busRelay;
        this.config = config;
        this.pool = pool;
    }
    static forRoot(options) {
        return {
            module: NoxaModule_1,
            providers: [
                {
                    provide: store_1.STORE_CONNECTION_POOL,
                    useValue: new pg_1.Pool({
                        connectionString: options.postgres.connectionUrl,
                    }),
                },
                {
                    provide: bus_1.BUS_RELAY_TOKEN,
                    useValue: options.bus,
                },
                {
                    provide: config_1.CONFIG_TOKEN,
                    useValue: {
                        context: options.context,
                        asyncDaemon: options.asyncDaemon,
                        documentTypes: options.documentTypes,
                    },
                },
            ],
            global: true,
        };
    }
    async onApplicationBootstrap() {
        const { commandHandlers, queryHandlers, eventHandlers } = this.handlerExplorer.explore();
        const connection = await this.pool.connect();
        try {
            await connection.query('BEGIN');
            await store_1.EventStore.createResources(connection);
            await store_1.OutboxStore.createResources(connection);
            for (const documentType of this.config.documentTypes || []) {
                await store_1.DocumentStore.createResources(documentType, connection);
            }
            await connection.query('COMMIT');
        }
        catch (error) {
            await connection.query('ROLLBACK');
            throw error;
        }
        finally {
            connection.release();
        }
        await this.busRelay.init(this.config);
        await this.commandBus.register(commandHandlers);
        await this.queryBus.register(queryHandlers);
        await this.eventBus.register(eventHandlers);
    }
};
exports.NoxaModule = NoxaModule;
exports.NoxaModule = NoxaModule = NoxaModule_1 = __decorate([
    (0, common_1.Module)({
        exports: [bus_1.CommandBus, bus_1.QueryBus, bus_1.EventBus, store_1.DocumentStore, store_1.StoreSession],
        providers: [
            bus_1.CommandBus,
            bus_1.QueryBus,
            bus_1.EventBus,
            store_1.DocumentStore,
            store_1.StoreSession,
            handlers_1.HandlerExplorer,
        ],
    }),
    __param(4, (0, bus_1.InjectBusRelay)()),
    __param(5, (0, config_1.InjectConfig)()),
    __param(6, (0, store_1.InjectStoreConnectionPool)()),
    __metadata("design:paramtypes", [handlers_1.HandlerExplorer,
        bus_1.CommandBus,
        bus_1.QueryBus,
        bus_1.EventBus, Object, Object, pg_1.Pool])
], NoxaModule);
