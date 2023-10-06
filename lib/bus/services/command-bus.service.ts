import { Injectable, Logger, Type } from '@nestjs/common';
import { Command, HandleCommand } from '../../handlers';
import { ModuleRef } from '@nestjs/core';
import {
  COMMAND_HANDLER_METADATA,
  COMMAND_METADATA,
} from '../../handlers/constants';
import { CommandMetadata } from '../../handlers/command/command-metadata.type';
import { BusImplementation } from '../bus-implementation.type';
import { InjectNoxaBus, InjectNoxaConfig } from '../../tokens';
import { NoxaConfig } from '../../noxa.module';
import { Outbox } from './outbox.service';

@Injectable({})
export class CommandBus {
  private handlers = new Map<string, HandleCommand<Command>>();

  logger = new Logger(CommandBus.name);

  constructor(
    @InjectNoxaBus()
    private readonly busImpl: BusImplementation,
    @InjectNoxaConfig()
    private readonly config: NoxaConfig,
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
      fromContext: toContext ? toContext : this.config.context,
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

    await this.busImpl.sendCommand({
      bus: 'command',
      type: this.getCommandName(command),
      fromContext: toContext ? toContext : this.config.context,
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

    const target = this.reflectCommandId(handler);

    if (!target) {
      throw new Error('invalid command handler');
    }

    this.handlers.set(target, instance);

    await this.busImpl.registerCommandHandler(instance);
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
