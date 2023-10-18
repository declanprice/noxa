import { Logger } from '@nestjs/common';
import { Channel, connect } from 'amqplib';

import { BusRelay } from '../bus-relay.type';
import { Command, HandleCommand, Event } from '../../handlers';
import { BusMessage } from '../bus-message.type';
import { Config } from '../../config';
import { RabbitmqEventConsumerType } from './rabbitmq-event-consumer-type';

const COMMAND_BUS_EXCHANGE_NAME = 'noxa.commandBus';
const EVENT_BUS_EXCHANGE_NAME = 'noxa.eventBus';

export type RabbitmqBusOptions = {
  connectionUrl: string;
  autoCreateResources?: boolean;
};

export class RabbitmqBus implements BusRelay {
  private logger = new Logger(RabbitmqBus.name);

  private channel?: Channel;
  private config?: Config;

  constructor(private readonly options: RabbitmqBusOptions) {}

  async init(config: Config): Promise<void> {
    const connection = await connect(this.options.connectionUrl);
    this.channel = await connection.createChannel();
    this.config = config;

    await this.channel.assertExchange(COMMAND_BUS_EXCHANGE_NAME, 'topic');
    await this.channel.assertExchange(EVENT_BUS_EXCHANGE_NAME, 'topic');
  }

  async sendCommand(command: BusMessage): Promise<void> {
    if (!this.channel) {
      throw new Error(`bus is not connected to rabbitmq, cannot send command`);
    }

    this.channel.publish(
      COMMAND_BUS_EXCHANGE_NAME,
      `noxa.${command.toContext}.commands.${command.type}`,
      Buffer.from(JSON.stringify(command)),
    );
  }

  async sendEvent(event: BusMessage): Promise<void> {
    if (!this.channel) {
      throw new Error(`bus is not connected to rabbitmq, cannot send event`);
    }

    this.channel.publish(
      EVENT_BUS_EXCHANGE_NAME,
      `noxa.${event.fromContext}.events.${event.type}`,
      Buffer.from(JSON.stringify(event)),
    );
  }

  async registerCommandHandler(
    handler: HandleCommand<Command>,
    options: { type: string },
  ): Promise<void> {
    if (!this.channel || !this.config) {
      throw new Error(
        `bus is not connected to rabbitmq, cannot register command handler`,
      );
    }

    const queueName = `noxa.${this.config.context}.commandHandlers.${handler.constructor.name}`;
    const queueRouteKey = `noxa.${this.config.context}.commands.${options.type}`;

    await this.channel.assertQueue(queueName);
    await this.channel.bindQueue(
      queueName,
      COMMAND_BUS_EXCHANGE_NAME,
      queueRouteKey,
    );

    await this.channel.consume(queueName, async (message) => {
      if (!this.channel || !message?.content) return;
      const parsedMessage = JSON.parse(message.content.toString());
      await handler.handle(parsedMessage.data, parsedMessage);
      this.channel.ack(message);
    });
  }

  async registerEventHandlerGroup(
    groupName: string,
    consumerType: RabbitmqEventConsumerType,
    eventTypes: string[],
    onMessage: (message: BusMessage) => Promise<void>,
  ): Promise<void> {
    if (!this.channel || !this.config) {
      throw new Error(
        `bus is not connected to rabbitmq, cannot register event handler group`,
      );
    }

    const queueName = `noxa.${this.config.context}.eventHandlers.${groupName}`;

    await this.channel.assertQueue(queueName, {
      arguments: {
        'x-single-active-consumer':
          consumerType === RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
      },
    });

    for (const eventType of eventTypes) {
      const queueRouteKey = `noxa.${this.config.context}.events.${eventType}`;

      await this.channel.bindQueue(
        queueName,
        EVENT_BUS_EXCHANGE_NAME,
        queueRouteKey,
      );
    }

    await this.channel.consume(queueName, async (message: any) => {
      try {
        if (!this.channel || !message?.content) return;

        const parsedMessage = JSON.parse(message.content.toString());

        await onMessage(parsedMessage);

        this.channel.ack(message);
      } catch (error) {
        this.logger.error(error);

        setTimeout(() => {
          this.channel?.nack(message);
        }, 3000);
      }
    });
  }
}
