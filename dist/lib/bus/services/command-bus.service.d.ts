import { Logger, Type } from '@nestjs/common';
import { Command, HandleCommand } from '../../handlers';
import { ModuleRef } from '@nestjs/core';
import { BusImplementation } from '../bus-implementation.type';
export declare class CommandBus {
    private readonly busImpl;
    private readonly moduleRef;
    private handlers;
    logger: Logger;
    constructor(busImpl: BusImplementation, moduleRef: ModuleRef);
    execute(command: Command): Promise<any>;
    sendCommand(command: Command): Promise<void>;
    registerCommandHandlers(handlers: HandleCommand<Command>[]): Promise<void>;
    register(handlers?: Type<HandleCommand>[]): void;
    protected registerHandler(handler: Type<HandleCommand>): void;
    private getCommandName;
    private getCommandId;
    private reflectCommandId;
}
