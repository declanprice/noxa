import { Inject } from '@nestjs/common';

import { Command, Event, HandleCommand, HandleEvent } from '../handlers';
import { BusMessage } from './bus-message.type';
import { Config } from '../config';
import { RabbitmqEventConsumerType } from './rabbitmq/rabbitmq-event-consumer-type';

export type BusRelay = {
  init(config: Config): Promise<void>;

  sendCommand(command: BusMessage): Promise<void>;
  sendEvent(event: BusMessage): Promise<void>;

  registerCommandHandler(
    handler: HandleCommand<Command>,
    options: {
      type: string;
    },
  ): Promise<void>;

  registerEventHandlerGroup(
    groupName: string,
    consumerType: RabbitmqEventConsumerType,
    eventTypes: string[],
    onMessage: (message: BusMessage) => Promise<void>,
  ): Promise<void>;
};

export const BUS_RELAY_TOKEN = 'BUS_RELAY_TOKEN';

export const InjectBusRelay = () => Inject(BUS_RELAY_TOKEN);
