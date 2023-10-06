import { Injectable, Logger } from '@nestjs/common';
import { BusMessage } from '../bus-message.type';

@Injectable({})
export class Outbox {
  logger = new Logger(Outbox.name);

  constructor() {}

  async publish(message: BusMessage): Promise<void> {}
}
