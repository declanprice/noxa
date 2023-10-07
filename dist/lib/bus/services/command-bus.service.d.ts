import { Logger, Type } from '@nestjs/common';
import { Command, HandleCommand } from '../../handlers';
import { ModuleRef } from '@nestjs/core';
import { BusRelay } from '../bus-relay.type';
import { Outbox } from './outbox.service';
import { Config } from '../../config';
export declare class CommandBus {
    private readonly busRelay;
    private readonly config;
    private readonly outbox;
    private readonly moduleRef;
    private handlers;
    logger: Logger;
    constructor(busRelay: BusRelay, config: Config, outbox: Outbox, moduleRef: ModuleRef);
    invoke(command: Command): Promise<any>;
    publish(command: Command, options: {
        toContext?: string;
        tenantId?: string;
        publishAt?: Date;
    }): Promise<void>;
    send(command: Command, options?: {
        toContext?: string;
        tenantId?: string;
        publishAt?: Date;
    }): Promise<void>;
    register(handlers?: Type<HandleCommand>[]): Promise<void>;
    protected registerHandler(handler: Type<HandleCommand>): Promise<void>;
    private getCommandName;
    private getCommandId;
    private reflectCommandHandler;
}
