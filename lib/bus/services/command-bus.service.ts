import { Inject, Injectable, Logger, Type } from '@nestjs/common';
import { Command, HandleCommand } from '../../handlers';
import { ModuleRef } from '@nestjs/core';
import {
  COMMAND_HANDLER_METADATA,
  COMMAND_METADATA,
} from '../../handlers/constants';

import { CommandMetadata } from '../../handlers/command/command-metadata.type';
import { BusImplementation } from '../bus-implementation.type';

@Injectable({})
export class CommandBus {
  private handlers = new Map<string, HandleCommand<Command>>();

  logger = new Logger(CommandBus.name);

  constructor(
    @Inject('NOXA_BUS_IMPL') private readonly busImpl: BusImplementation,
    private readonly moduleRef: ModuleRef,
  ) {}

  execute(command: Command) {
    const commandId = this.getCommandId(command);

    const handler = this.handlers.get(commandId);

    if (!handler) {
      const commandName = this.getCommandName(command);
      throw new Error(`command handler not found for ${commandName}`);
    }

    return handler.handle(command);
  }

  async sendCommand(command: Command): Promise<void> {
    return await this.busImpl.sendCommand(command);
  }

  async registerCommandHandlers(
    handlers: HandleCommand<Command>[],
  ): Promise<void> {}

  register(handlers: Type<HandleCommand>[] = []) {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  protected registerHandler(handler: Type<HandleCommand>) {
    const instance = this.moduleRef.get(handler, { strict: false });

    if (!instance) {
      return;
    }

    const target = this.reflectCommandId(handler);

    if (!target) {
      throw new Error('invalid command handler');
    }

    this.handlers.set(target, instance);
  }

  private getCommandName(command: Command): string {
    const { constructor } = Object.getPrototypeOf(command);

    return constructor.name as string;
  }

  private getCommandId(command: Command): string {
    const { constructor: commandType } = Object.getPrototypeOf(command);

    const commandMetadata: CommandMetadata = Reflect.getMetadata(
      COMMAND_METADATA,
      commandType,
    );

    if (!commandMetadata) {
      throw new Error('command handler not found');
    }

    return commandMetadata.id;
  }

  private reflectCommandId(handler: Type<HandleCommand>): string | undefined {
    const command: Command = Reflect.getMetadata(
      COMMAND_HANDLER_METADATA,
      handler,
    );

    const commandMetadata: CommandMetadata = Reflect.getMetadata(
      COMMAND_METADATA,
      command,
    );

    return commandMetadata.id;
  }
}
