import { ModuleRef } from '@nestjs/core';
import { Injectable, Logger, Type } from '@nestjs/common';
import { EventMessage, HandleEvent } from '../../handlers';
import { BusRelay, InjectBusRelay } from '../bus-relay.type';
import { Config, InjectConfig } from '../../config';
import {
    getEventHandlerType,
    getEventHandlerOptions,
} from '../../handlers/event/event-handler.decorator';
import { BusMessage } from '../bus-message.type';
import {
    getProcessEventsMetadata,
    getProcessMetadata,
} from '../../handlers/process/process.decorators';
import {
    getEventGroupTypes,
    getEventGroupOptions,
    getEventGroupHandler,
} from '../../handlers/event/group/event-group.decorator';
import { GroupCannotHandleEventTypeError } from './errors/group-cannot-handle-event-type.error';
import { DatabaseClient } from '../../store/database-client.service';
import { handleProcess } from '../../handlers/process';

@Injectable({})
export class EventBus {
    logger = new Logger(EventBus.name);

    constructor(
        @InjectBusRelay()
        private readonly busRelay: BusRelay,
        @InjectConfig()
        private readonly config: Config,
        private readonly moduleRef: ModuleRef,
        private readonly db: DatabaseClient,
    ) {}

    async send(event: any, options: { publishAt?: Date }): Promise<void> {
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

            const eventType = getEventHandlerType(handler);
            const options = getEventHandlerOptions(handler);
            const groupName = handler.name;

            await this.busRelay.registerEventHandler(
                groupName,
                options.consumerType,
                eventType,
                async (message) => {
                    const eventMessage: EventMessage<any> = {
                        type: message.type,
                        data: message.data,
                    };

                    await instance.handle(eventMessage);
                },
            );
        }
    }

    async registerEventGroupHandlers(eventGroupHandlers: Type[] = []) {
        for (const handler of eventGroupHandlers) {
            const instance = this.moduleRef.get(handler, { strict: false });

            if (!instance) {
                throw new Error(
                    `module ref could not resolve ${handler}, make sure it has been provided`,
                );
            }

            const options = getEventGroupOptions(handler);
            const eventTypes = getEventGroupTypes(handler);
            const groupName = handler.name;

            await this.busRelay.registerEventGroupHandler(
                groupName,
                options.consumerType,
                Array.from(eventTypes),
                async (message) => {
                    const eventMessage: EventMessage<any> = {
                        type: message.type,
                        data: message.data,
                    };

                    const method = getEventGroupHandler(
                        instance.constructor,
                        message.type,
                    );

                    if (!method) {
                        throw new GroupCannotHandleEventTypeError(
                            this.constructor.name,
                            message.type,
                        );
                    }

                    await instance[method](eventMessage);
                },
            );
        }
    }

    async registerProcessHandlers(processes: Type[] = []) {
        for (const process of processes) {
            const metadata = getProcessMetadata(process);
            const eventTypes = getProcessEventsMetadata(process);
            const groupName = process.name;

            const instance = this.moduleRef.get(process, { strict: false });

            if (!instance) {
                throw new Error(
                    `module ref could not resolve ${process.name}, make sure it has been provided`,
                );
            }

            await this.busRelay.registerEventGroupHandler(
                groupName,
                metadata.consumerType,
                Array.from(eventTypes),
                async (message: BusMessage) => {
                    await handleProcess(this.db, instance, metadata, message);
                },
            );
        }
    }
}
