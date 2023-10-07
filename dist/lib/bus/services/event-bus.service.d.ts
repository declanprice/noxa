import { ModuleRef } from '@nestjs/core';
import { Logger, Type } from '@nestjs/common';
import { HandleEvent } from '../../handlers';
import { BusRelay } from '../bus-relay.type';
import { Outbox } from './outbox.service';
import { Config } from '../../config';
export declare class EventBus {
    private readonly busRelay;
    private readonly config;
    private readonly outbox;
    private readonly moduleRef;
    private handlers;
    logger: Logger;
    constructor(busRelay: BusRelay, config: Config, outbox: Outbox, moduleRef: ModuleRef);
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
    private reflectEventHandler;
}
