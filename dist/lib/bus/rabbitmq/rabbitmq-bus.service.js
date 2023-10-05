"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitmqBus = void 0;
const common_1 = require("@nestjs/common");
class RabbitmqBus {
    constructor(connectionUrl) {
        this.logger = new common_1.Logger(RabbitmqBus.name);
    }
    async sendCommand(command) {
        this.logger.log('rabbitmq send command', command);
    }
    async registerCommandHandlers(handlers) { }
    async sendEvent(event) { }
    async registerEventHandlers(handlers) { }
    async registerSagas(sagas) { }
    async registerProcesses(processes) { }
}
exports.RabbitmqBus = RabbitmqBus;
