import { Logger, Type } from '@nestjs/common';
import { Command, HandleCommand } from '../../handlers';
import { ModuleRef } from '@nestjs/core';
import { BusImplementation } from '../bus-implementation.type';
import { NoxaConfig } from '../../noxa.module';
import { Outbox } from './outbox.service';
export declare class CommandBus {
    private readonly busImpl;
    private readonly config;
    private readonly outbox;
    private readonly moduleRef;
    private handlers;
    logger: Logger;
    constructor(busImpl: BusImplementation, config: NoxaConfig, outbox: Outbox, moduleRef: ModuleRef);
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
    private reflectCommandId;
}
