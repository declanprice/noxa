import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Command, HandleCommand } from '../../handlers';
import { BusRelay, InjectBusRelay } from '../bus-relay.type';
import { Config, InjectConfig } from '../../config';
import { COMMAND_HANDLER_METADATA } from '../../handlers/command/command-handler.decorator';
import { BusMessage } from '../bus-message.type';
import {
    DataStore,
    EventStore,
    InjectDatabase,
    OutboxStore,
} from '../../store';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

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
        @InjectDatabase()
        private readonly db: NodePgDatabase<any>,
    ) {}

    async invoke(command: Command): Promise<void> {
        return await this.invokeHandler(command.constructor.name, command);
    }

    async send(
        command: Command,
        options?: { publishAt?: Date },
    ): Promise<void> {
        const { publishAt } = options || {};

        await this.busRelay.sendCommand({
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

        await this.busRelay.registerCommandHandler(
            handler.name,
            command.name,
            async (message) => {
                await this.invokeHandler(message.type, message.data, message);
            },
        );
    }

    private async invokeHandler(
        type: string,
        data: any,
        originalMessage?: BusMessage,
    ): Promise<void> {
        const handler = this.handlers.get(type);

        if (!handler) {
            throw new Error(`command handler not found for ${type}`);
        }

        return await this.db.transaction(async (tx) => {
            return await handler.handle(data, {
                data: new DataStore(tx),
                event: new EventStore(tx),
                outbox: new OutboxStore(tx),
            });
        });
    }
}
