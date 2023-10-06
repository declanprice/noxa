"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitmqBus = void 0;
const common_1 = require("@nestjs/common");
const amqplib_1 = require("amqplib");
const COMMAND_BUS_EXCHANGE_NAME = 'noxa.commandBus';
const EVENT_BUS_EXCHANGE_NAME = 'noxa.eventBus';
class RabbitmqBus {
    constructor(options) {
        this.options = options;
        this.logger = new common_1.Logger(RabbitmqBus.name);
        this.connect(options.connectionUrl).then();
    }
    async connect(connectionUrl) {
        const connection = await (0, amqplib_1.connect)(connectionUrl);
        this.channel = await connection.createChannel();
    }
    async sendCommand(message) {
        this.logger.log(`noxa.${message.fromContext}.commands.${message.type}`);
        if (this.channel) {
            this.channel.publish(COMMAND_BUS_EXCHANGE_NAME, `noxa.${message.fromContext}.commands.${message.type}`, Buffer.from(JSON.stringify(message)));
        }
    }
    async registerCommandHandler(handler) {
        this.logger.log('register command handler', handler);
    }
    async sendEvent(event) {
        this.logger.log('rabbitmq send event', event);
    }
    async registerEventHandler(handler) {
        this.logger.log('register event handler', handler);
    }
}
exports.RabbitmqBus = RabbitmqBus;
