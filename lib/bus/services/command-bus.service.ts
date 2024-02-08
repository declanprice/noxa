import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Command, HandleCommand } from '../../handlers';
import { BusRelay, InjectBusRelay } from '../bus-relay.type';
import { Config, InjectConfig } from '../../config';
import { COMMAND_HANDLER_METADATA } from '../../handlers/command/command-handler.decorator';
import { BusMessage } from '../bus-message.type';

@Injectable({})
export class CommandBus {
    private handlers = new Map<string, HandleCommand>();

    logger = new Logger(CommandBus.name);

    constructor(
        @InjectBusRelay()
        private readonly busRelay: BusRelay,
        @InjectConfig()
        private readonly config: Config,
        private readonly moduleRef: ModuleRef,
    ) {
    }

    async invoke(type: string, data: any): Promise<void> {
        return this.invokeHandler(type, data);
    }

    async send(
        command: Command,
        options?: { publishAt?: Date },
    ): Promise<void> {
        const { publishAt } = options || {};

        return this.busRelay.sendCommand({
            type: command.constructor.name,
            timestamp: publishAt
                ? publishAt.toISOString()
                : new Date().toISOString(),
            data: command,
        });
    }

    async registerCommandHandlers(handlers: Type<HandleCommand>[] = []) {
        for (const handler of handlers) {
            await this.registerHandler(handler);
        }
    }

    private async registerHandler(handler: Type<HandleCommand>) {
        const type: string = Reflect.getMetadata(
            COMMAND_HANDLER_METADATA,
            handler,
        );

        const instance = this.moduleRef.get(handler, { strict: false });

        if (!instance) {
            throw new Error(
                `module ref could not resolve ${handler}, make sure it has been provided`,
            );
        }

        this.handlers.set(type, instance);

        return this.busRelay.registerCommandHandler(
            handler.name,
            type,
            async (message) => {
                await this.invokeHandler(message.type, message.data, message);
            },
        );
    }

    private async invokeHandler(
        type: string,
        data: any,
        originalMessage?: BusMessage,
    ) {
        const handler = this.handlers.get(type);

        if (!handler) {
            throw new Error(`command handler not found for ${type}`);
        }

        return handler.handle(data);
    }
}
