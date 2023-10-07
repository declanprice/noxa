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
    }
    async init(config) {
        const connection = await (0, amqplib_1.connect)(this.options.connectionUrl);
        this.channel = await connection.createChannel();
        this.config = config;
        await this.channel.assertExchange(COMMAND_BUS_EXCHANGE_NAME, 'topic');
        await this.channel.assertExchange(EVENT_BUS_EXCHANGE_NAME, 'topic');
    }
    async sendCommand(command) {
        if (!this.channel) {
            throw new Error(`bus is not connected to rabbitmq, cannot send command`);
        }
        this.logger.log(`sending command to command bus, ${command}`);
        this.channel.publish(COMMAND_BUS_EXCHANGE_NAME, `noxa.${command.targetContext}.commands.${command.type}`, Buffer.from(JSON.stringify(command)));
    }
    async sendEvent(event) {
        if (!this.channel) {
            throw new Error(`bus is not connected to rabbitmq, cannot send event`);
        }
        this.logger.log(`sending event to rabbitmq exchange (${EVENT_BUS_EXCHANGE_NAME}) - ${event}`);
        this.channel.publish(EVENT_BUS_EXCHANGE_NAME, `noxa.${event.targetContext}.events.${event.type}`, Buffer.from(JSON.stringify(event)));
    }
    async registerCommandHandler(handler, options) {
        if (!this.channel || !this.config) {
            throw new Error(`bus is not connected to rabbitmq, cannot register command handler`);
        }
        const queueName = `noxa.${this.config.context}.commandHandlers.${handler.constructor.name}`;
        const queueRouteKey = `noxa.${this.config.context}.commands.${options.type}`;
        await this.channel.assertQueue(queueName);
        await this.channel.bindQueue(queueName, COMMAND_BUS_EXCHANGE_NAME, queueRouteKey);
        await this.channel.consume(queueName, async (message) => {
            if (!this.channel || !message?.content)
                return;
            const parsedMessage = JSON.parse(message.content.toString());
            await handler.handle(parsedMessage);
            this.channel.ack(message);
        });
    }
    async registerEventHandler(handler, options) {
        if (!this.channel || !this.config) {
            throw new Error(`bus is not connected to rabbitmq, cannot register event handler`);
        }
        const queueName = `noxa.${this.config.context}.eventHandlers.${handler.constructor.name}`;
        const queueRouteKey = `noxa.${this.config.context}.events.${options.type}`;
        await this.channel.assertQueue(queueName);
        await this.channel.bindQueue(queueName, EVENT_BUS_EXCHANGE_NAME, queueRouteKey);
        await this.channel.consume(queueName, async (message) => {
            if (!this.channel || !message?.content)
                return;
            const parsedMessage = JSON.parse(message.content.toString());
            await handler.handle(parsedMessage);
            this.channel.ack(message);
        });
    }
}
exports.RabbitmqBus = RabbitmqBus;
