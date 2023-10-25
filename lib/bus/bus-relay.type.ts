import { Inject } from '@nestjs/common';

import { BusMessage } from './bus-message.type';
import { Config } from '../config';
import { RabbitmqEventConsumerType } from './rabbitmq/rabbitmq-event-consumer-type';

export type BusRelay = {
  init(config: Config): Promise<void>;

  sendCommand(command: BusMessage): Promise<void>;
  sendEvent(event: BusMessage): Promise<void>;

  registerCommandHandler(
    handlerName: string,
    commandType: string,
    onMessage: (message: BusMessage) => Promise<void>,
  ): Promise<void>;

  registerEventHandler(
    handlerName: string,
    consumerType: RabbitmqEventConsumerType,
    eventType: string,
    onMessage: (message: BusMessage) => Promise<void>,
  ): Promise<void>;

  registerEventGroupHandler(
    handlerName: string,
    consumerType: RabbitmqEventConsumerType,
    eventTypes: string[],
    onMessage: (message: BusMessage) => Promise<void>,
  ): Promise<void>;
};

export const BUS_RELAY_TOKEN = 'BUS_RELAY_TOKEN';

export const InjectBusRelay = () => Inject(BUS_RELAY_TOKEN);
