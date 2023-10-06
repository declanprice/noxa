import { ModuleRef } from '@nestjs/core';
import { Logger, Type } from '@nestjs/common';
import { HandleEvent } from '../../handlers';
import { BusImplementation } from '../bus-implementation.type';
import { Outbox } from './outbox.service';
import { NoxaConfig } from '../../noxa.module';
export declare class EventBus {
    private readonly busImpl;
    private readonly config;
    private readonly outbox;
    private readonly moduleRef;
    private handlers;
    logger: Logger;
    constructor(busImpl: BusImplementation, config: NoxaConfig, outbox: Outbox, moduleRef: ModuleRef);
    invoke(event: Event): Promise<any>;
    sendEvent(event: Event, options: {
        toContext?: string;
        tenantId?: string;
        publishAt?: Date;
    }): Promise<void>;
    publish(event: Event, options: {
        toContext?: string;
        tenantId?: string;
        publishAt?: Date;
    }): Promise<void>;
    register(handlers?: Type<HandleEvent>[]): Promise<void>;
    protected registerHandler(handler: Type<HandleEvent>): Promise<void>;
    private getEventName;
    private getEventId;
    private reflectEventId;
}
