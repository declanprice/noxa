import { Inject } from '@nestjs/common';

import { Command, HandleCommand, HandleEvent } from '../handlers';
import { BusMessage } from './bus-message.type';
import { Config } from '../config';

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

  registerEventHandler(
    handler: HandleEvent<Event>,
    options: {
      type: string;
    },
  ): Promise<void>;
};

export const BUS_RELAY_TOKEN = 'BUS_RELAY_TOKEN';

export const InjectBusRelay = () => Inject(BUS_RELAY_TOKEN);
