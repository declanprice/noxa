import { Injectable, Logger, Type } from '@nestjs/common';
import { Command, HandleCommand } from '../../handlers';
import { ModuleRef } from '@nestjs/core';
import {
  COMMAND_HANDLER_METADATA,
  COMMAND_METADATA,
} from '../../handlers/constants';
import { CommandMetadata } from '../../handlers/command/command-metadata.type';
import { BusRelay, InjectBusRelay } from '../bus-relay.type';
import { Outbox } from './outbox.service';
import { Config, InjectConfig } from '../../config';

@Injectable({})
export class CommandBus {
  private handlers = new Map<string, HandleCommand<Command>>();

  logger = new Logger(CommandBus.name);

  constructor(
    @InjectBusRelay()
    private readonly busRelay: BusRelay,
    @InjectConfig()
    private readonly config: Config,
    private readonly outbox: Outbox,
    private readonly moduleRef: ModuleRef,
  ) {}

  invoke(command: Command) {
    const commandId = this.getCommandId(command);

    const handler = this.handlers.get(commandId);

    if (!handler) {
      const commandName = this.getCommandName(command);
      throw new Error(`command handler not found for ${commandName}`);
    }

    return handler.handle(command);
  }

  async publish(
    command: Command,
    options: { toContext?: string; tenantId?: string; publishAt?: Date },
  ): Promise<void> {
    const { toContext, tenantId, publishAt } = options;

    await this.outbox.publish({
      bus: 'command',
      type: this.getCommandName(command),
      fromContext: this.config.context,
      targetContext: toContext ? toContext : this.config.context,
      tenantId: tenantId ? tenantId : 'DEFAULT',
      timestamp: publishAt ? publishAt.toISOString() : new Date().toISOString(),
      data: command,
    });
  }

  async send(
    command: Command,
    options?: { toContext?: string; tenantId?: string; publishAt?: Date },
  ): Promise<void> {
    const { toContext, tenantId, publishAt } = options || {};

    await this.busRelay.sendCommand({
      bus: 'command',
      type: this.getCommandName(command),
      fromContext: this.config.context,
      targetContext: toContext ? toContext : this.config.context,
      tenantId: tenantId ? tenantId : 'DEFAULT',
      timestamp: publishAt ? publishAt.toISOString() : new Date().toISOString(),
      data: command,
    });
  }

  async register(handlers: Type<HandleCommand>[] = []) {
    for (const handler of handlers) {
      await this.registerHandler(handler);
    }
  }

  protected async registerHandler(handler: Type<HandleCommand>) {
    const instance = this.moduleRef.get(handler, { strict: false });

    if (!instance) {
      return;
    }

    const { id, type } = this.reflectCommandHandler(handler);

    if (!id) {
      throw new Error('invalid command handler');
    }

    this.handlers.set(id, instance);

    await this.busRelay.registerCommandHandler(instance, {
      type,
    });
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

  private reflectCommandHandler(handler: Type<HandleCommand>): {
    id: string;
    type: string;
  } {
    const command: Command = Reflect.getMetadata(
      COMMAND_HANDLER_METADATA,
      handler,
    );

    const commandMetadata: CommandMetadata = Reflect.getMetadata(
      COMMAND_METADATA,
      command,
    );

    if (!command || !commandMetadata) {
      throw new Error(
        `reflect data not found for handler ${handler.constructor.name}`,
      );
    }

    return {
      id: commandMetadata.id,
      type: commandMetadata.type,
    };
  }
}
