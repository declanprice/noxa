import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Command, HandleCommand } from '../../handlers';
import { BusRelay, InjectBusRelay } from '../bus-relay.type';
import { Config, InjectConfig } from '../../config';
import { COMMAND_HANDLER_METADATA } from '../../handlers/command/command-handler.decorator';

@Injectable({})
export class CommandBus {
  private handlers = new Map<string, HandleCommand<Command>>();

  logger = new Logger(CommandBus.name);

  constructor(
    @InjectBusRelay()
    private readonly busRelay: BusRelay,
    @InjectConfig()
    private readonly config: Config,
    private readonly moduleRef: ModuleRef,
  ) {}

  async invoke(command: Command): Promise<void> {
    const commandName = this.getCommandName(command);

    const handler = this.handlers.get(commandName);

    if (!handler) {
      throw new Error(`command handler not found for ${commandName}`);
    }

    return await handler.handle(command);
  }

  async sendCommand(
    command: Command,
    options?: { toContext?: string; tenantId?: string; publishAt?: Date },
  ): Promise<void> {
    const { toContext, tenantId, publishAt } = options || {};

    await this.busRelay.sendCommand({
      type: this.getCommandName(command),
      fromContext: this.config.context,
      toContext: toContext ? toContext : this.config.context,
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
    const command: Type<Command> = Reflect.getMetadata(
      COMMAND_HANDLER_METADATA,
      handler,
    );

    const instance = this.moduleRef.get(handler, { strict: false });

    if (!instance) {
      throw new Error(
        `module ref could not resolve ${handler}, make sure it has been provided`,
      );
    }

    this.handlers.set(command.name, instance);

    await this.busRelay.registerCommandHandler(instance, {
      type: command.name,
    });
  }

  private getCommandName(command: Command): string {
    const { constructor } = Object.getPrototypeOf(command);

    return constructor.name as string;
  }
}
