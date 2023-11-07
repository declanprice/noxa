import { ModuleRef } from '@nestjs/core';
import { Injectable, Logger, Type } from '@nestjs/common';
import { HandleEvent, HandleProcess, HandleEventGroup } from '../../handlers';
import { BusRelay, InjectBusRelay } from '../bus-relay.type';
import { Config, InjectConfig } from '../../config';
import {
    getEventHandler,
    getEventHandlerOptions,
} from '../../handlers/event/event-handler.decorator';
import { BusMessage } from '../bus-message.type';
import {
    getProcessEventTypesMetadata,
    getProcessOptionMetadata,
} from '../../handlers/process/process.decorators';
import {
    getSagaEventTypes,
    getSagaOptionMetadata,
} from '../../handlers/saga/saga.decorators';
import {
    getEventGroupEventTypes,
    getEventGroupOptions,
} from '../../handlers/event/group/event-group.decorator';
import { HandleSaga } from '../../handlers/saga/handle-saga';
import {
    DataStore,
    EventStore,
    InjectDatabase,
    OutboxStore,
} from '../../store';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable({})
export class EventBus {
    logger = new Logger(EventBus.name);

    constructor(
        @InjectBusRelay()
        private readonly busRelay: BusRelay,
        @InjectConfig()
        private readonly config: Config,
        private readonly moduleRef: ModuleRef,
        @InjectDatabase()
        private readonly db: NodePgDatabase<any>,
    ) {}

    async send(event: Event, options: { publishAt?: Date }): Promise<void> {
        const { publishAt } = options;

        await this.busRelay.sendEvent({
            type: event.constructor.name,
            timestamp: publishAt
                ? publishAt.toISOString()
                : new Date().toISOString(),
            data: event,
        });
    }

    async registerEventHandlers(handlers: Type<HandleEvent>[] = []) {
        for (const handler of handlers) {
            const instance = this.moduleRef.get(handler, { strict: false });

            if (!instance) {
                throw new Error(
                    `module ref could not resolve ${handler}, make sure it has been provided`,
                );
            }

            const event = getEventHandler(handler);
            const options = getEventHandlerOptions(handler);
            const groupName = handler.name;

            await this.busRelay.registerEventHandler(
                groupName,
                options.consumerType,
                event.name,
                async (message) => {
                    await this.db.transaction(async (tx) => {
                        await instance.handle(message, {
                            data: new DataStore(tx),
                            event: new EventStore(tx),
                            outbox: new OutboxStore(tx),
                        });
                    });
                },
            );
        }
    }

    async registerEventGroupHandlers(
        eventGroupHandlers: Type<HandleEventGroup>[] = [],
    ) {
        for (const handler of eventGroupHandlers) {
            const instance = this.moduleRef.get(handler, { strict: false });

            if (!instance) {
                throw new Error(
                    `module ref could not resolve ${handler}, make sure it has been provided`,
                );
            }

            const options = getEventGroupOptions(handler);
            const eventTypes = getEventGroupEventTypes(handler);
            const groupName = handler.name;

            await this.busRelay.registerEventGroupHandler(
                groupName,
                options.consumerType,
                Array.from(eventTypes),
                async (message) => {
                    await instance.handle(message);
                },
            );
        }
    }

    async registerProcessHandlers(processes: Type<HandleProcess>[] = []) {
        for (const process of processes) {
            const instance = this.moduleRef.get(process, { strict: false });

            if (!instance) {
                throw new Error(
                    `module ref could not resolve ${process.name}, make sure it has been provided`,
                );
            }

            const options = getProcessOptionMetadata(process);
            const eventTypes = getProcessEventTypesMetadata(process);
            const groupName = process.name;

            await this.busRelay.registerEventGroupHandler(
                groupName,
                options.consumerType,
                Array.from(eventTypes),
                async (message: BusMessage) => {
                    await instance.handle(message);
                },
            );
        }
    }

    async registerSagaHandlers(
        sagaHandlers: Type<HandleSaga>[] = [],
    ): Promise<void> {
        console.log(sagaHandlers);

        for (const saga of sagaHandlers) {
            const instance = this.moduleRef.get(saga, { strict: false });

            if (!instance) {
                throw new Error(
                    `module ref could not resolve ${saga.name}, make sure it has been provided`,
                );
            }

            const options = getSagaOptionMetadata(saga);
            const eventTypes = getSagaEventTypes(saga);
            const groupName = saga.name;

            await this.busRelay.registerEventGroupHandler(
                groupName,
                options.consumerType,
                Array.from(eventTypes),
                async (message: BusMessage) => {
                    await instance.handle(message);
                },
            );
        }
    }
}
