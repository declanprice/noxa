import { Logger } from '@nestjs/common';

import { BusImplementation } from '../bus-implementation.type';

import { Command, HandleCommand, HandleEvent } from '../../handlers';

import { Channel, connect } from 'amqplib';
import { BusMessage } from '../bus-message.type';

const COMMAND_BUS_EXCHANGE_NAME = 'noxa.commandBus';
const EVENT_BUS_EXCHANGE_NAME = 'noxa.eventBus';

export type RabbitmqBusOptions = {
  connectionUrl: string;
  autoCreateResources?: boolean;
};

export class RabbitmqBus implements BusImplementation {
  private logger = new Logger(RabbitmqBus.name);

  private channel?: Channel;

  constructor(private readonly options: RabbitmqBusOptions) {
    this.connect(options.connectionUrl).then();
  }

  async connect(connectionUrl: string): Promise<void> {
    const connection = await connect(connectionUrl);
    this.channel = await connection.createChannel();
  }

  async sendCommand(message: BusMessage): Promise<void> {
    this.logger.log(`noxa.${message.fromContext}.commands.${message.type}`);

    if (this.channel) {
      this.channel.publish(
        COMMAND_BUS_EXCHANGE_NAME,
        `noxa.${message.fromContext}.commands.${message.type}`,
        Buffer.from(JSON.stringify(message)),
      );
    }
  }

  async registerCommandHandler(handler: HandleCommand<Command>): Promise<void> {
    this.logger.log('register command handler', handler);
  }

  async sendEvent(event: BusMessage): Promise<void> {
    this.logger.log('rabbitmq send event', event);
  }

  async registerEventHandler(handler: HandleEvent<Event>): Promise<void> {
    this.logger.log('register event handler', handler);
  }
}
