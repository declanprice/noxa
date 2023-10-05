import { Injectable, Logger } from '@nestjs/common';

@Injectable({})
export class BusOutbox {
  logger = new Logger(BusOutbox.name);

  constructor() {}

  execute() {
    this.logger.log('\x1b[33m Welcome to the app! \x1b[0m');
  }
}
