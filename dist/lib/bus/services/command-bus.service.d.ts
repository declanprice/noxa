import { Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Command, HandleCommand } from '../../handlers';
import { BusRelay } from '../bus-relay.type';
import { Config } from '../../config';
export declare class CommandBus {
    private readonly busRelay;
    private readonly config;
    private readonly moduleRef;
    private handlers;
    logger: Logger;
    constructor(busRelay: BusRelay, config: Config, moduleRef: ModuleRef);
    invoke(command: Command): Promise<void>;
    sendCommand(command: Command, options?: {
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
