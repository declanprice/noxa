import { Logger } from '@nestjs/common';
import { Channel, connect } from 'amqplib';

import { BusRelay } from '../bus-relay.type';
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
      `noxa.commands.${command.type}`,
      Buffer.from(JSON.stringify(command)),
    );
  }

  async sendEvent(event: BusMessage): Promise<void> {
    if (!this.channel) {
      throw new Error(`bus is not connected to rabbitmq, cannot send event`);
    }

    this.channel.publish(
      EVENT_BUS_EXCHANGE_NAME,
      `noxa.events.${event.type}`,
      Buffer.from(JSON.stringify(event)),
    );
  }

  async registerCommandHandler(
    handlerName: string,
    commandType: string,
    onMessage: (message: BusMessage) => Promise<void>,
  ): Promise<void> {
    if (!this.channel || !this.config) {
      throw new Error(
        `bus is not connected to rabbitmq, cannot register command handler`,
      );
    }

    const queueName = `noxa.${this.config.serviceName}.commandHandlers.${handlerName}`;
    const queueRouteKey = `noxa.commands.${commandType}`;

    await this.channel.assertQueue(queueName);
    await this.channel.bindQueue(
      queueName,
      COMMAND_BUS_EXCHANGE_NAME,
      queueRouteKey,
    );

    await this.consumeMessage(queueName, onMessage);
  }

  async registerEventHandler(
    handlerName: string,
    consumerType: RabbitmqEventConsumerType,
    eventType: string,
    onMessage: (message: BusMessage) => Promise<void>,
  ): Promise<void> {
    if (!this.channel || !this.config) {
      throw new Error(
        `bus is not connected to rabbitmq, cannot register command handler`,
      );
    }

    const queueName = `noxa.${this.config.serviceName}.eventHandlers.${handlerName}`;
    const queueRouteKey = `noxa.events.${eventType}`;

    await this.channel.assertQueue(queueName, {
      arguments: {
        'x-single-active-consumer':
          consumerType === RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
      },
    });

    await this.channel.bindQueue(
      queueName,
      EVENT_BUS_EXCHANGE_NAME,
      queueRouteKey,
    );

    await this.consumeMessage(queueName, onMessage);
  }

  async registerEventGroupHandler(
    handlerName: string,
    consumerType: RabbitmqEventConsumerType,
    eventTypes: string[],
    onMessage: (message: BusMessage) => Promise<void>,
  ): Promise<void> {
    if (!this.channel || !this.config) {
      throw new Error(
        `bus is not connected to rabbitmq, cannot register event handler group`,
      );
    }

    const queueName = `noxa.${this.config.serviceName}.eventHandlers.${handlerName}`;

    await this.channel.assertQueue(queueName, {
      arguments: {
        'x-single-active-consumer':
          consumerType === RabbitmqEventConsumerType.SINGLE_ACTIVE_CONSUMER,
      },
    });

    for (const eventType of eventTypes) {
      const queueRouteKey = `noxa.events.${eventType}`;

      await this.channel.bindQueue(
        queueName,
        EVENT_BUS_EXCHANGE_NAME,
        queueRouteKey,
      );
    }

    await this.consumeMessage(queueName, onMessage);
  }

  private async consumeMessage(
    queueName: string,
    onMessage: (message: any) => Promise<void>,
  ) {
    if (!this.channel) {
      throw new Error('not connected to rabbitmq channel');
    }

    await this.channel.consume(queueName, async (message: any) => {
      if (!this.channel || !message?.content) return;

      try {
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
