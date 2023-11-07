import { Injectable, Type } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { Module } from '@nestjs/core/injector/module';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

import { HandleCommand } from './command/handle-command';
import { HandleEvent } from './event/handle-event';
import { HandleQuery } from './query/handle-query';
import {
    DATA_PROJECTION_HANDLER,
    EVENT_PROJECTION_HANDLER,
} from './projection/projection.decorators';
import { EVENT_HANDLER_METADATA } from './event/event-handler.decorator';
import { COMMAND_HANDLER_METADATA } from './command/command-handler.decorator';
import { QUERY_HANDLER_METADATA } from './query/query-handler.decorator';
import { HandleProcess } from './process';
import { PROCESS_HANDLER_METADATA } from './process/process.decorators';
import { SAGA_HANDLER_METADATA } from './saga/saga.decorators';
import { HandleSaga } from './saga/handle-saga';
import { HandleEventGroup } from './event';
import { EVENT_GROUP_HANDLER_METADATA } from './event/group/event-group.decorator';

export type HandlerOptions = {
    commandHandlers: Type<HandleCommand>[];
    queryHandlers: Type<HandleQuery>[];
    eventHandlers: Type<HandleEvent>[];
    eventGroupHandlers: Type<HandleEventGroup>[];
    dataProjectionHandlers: Type[];
    eventProjectionHandlers: Type[];
    processHandlers: Type<HandleProcess>[];
    sagaHandlers: Type<HandleSaga>[];
};

@Injectable()
export class HandlerExplorer {
    constructor(private readonly modulesContainer: ModulesContainer) {}

    explore(): HandlerOptions {
        const modules = [...this.modulesContainer.values()];

        const commandHandlers = this.flatMap<HandleCommand>(
            modules,
            (instance) =>
                this.filterProvider(instance, COMMAND_HANDLER_METADATA),
        );

        const queryHandlers = this.flatMap<HandleQuery>(modules, (instance) =>
            this.filterProvider(instance, QUERY_HANDLER_METADATA),
        );

        const eventHandlers = this.flatMap<HandleEvent>(modules, (instance) =>
            this.filterProvider(instance, EVENT_HANDLER_METADATA),
        );

        const eventGroupHandlers = this.flatMap<HandleEventGroup>(
            modules,
            (instance) =>
                this.filterProvider(instance, EVENT_GROUP_HANDLER_METADATA),
        );

        const dataProjectionHandlers = this.flatMap<any>(modules, (instance) =>
            this.filterProvider(instance, DATA_PROJECTION_HANDLER),
        );

        const eventProjectionHandlers = this.flatMap<any>(modules, (instance) =>
            this.filterProvider(instance, EVENT_PROJECTION_HANDLER),
        );

        const processHandlers = this.flatMap<HandleProcess>(
            modules,
            (instance) =>
                this.filterProvider(instance, PROCESS_HANDLER_METADATA),
        );

        const sagaHandlers = this.flatMap<HandleSaga>(modules, (instance) =>
            this.filterProvider(instance, SAGA_HANDLER_METADATA),
        );

        return {
            commandHandlers,
            queryHandlers,
            eventHandlers,
            eventGroupHandlers,
            dataProjectionHandlers,
            eventProjectionHandlers,
            processHandlers,
            sagaHandlers,
        };
    }

    flatMap<T>(
        modules: Module[],
        callback: (instance: InstanceWrapper) => Type<any> | undefined,
    ): Type<T>[] {
        const items = modules
            .map((module) => [...module.providers.values()].map(callback))
            .reduce((a, b) => a.concat(b), []);
        return items.filter((element) => !!element) as Type<T>[];
    }

    filterProvider(
        wrapper: InstanceWrapper,
        metadataKey: string,
    ): Type<any> | undefined {
        const { instance } = wrapper;
        if (!instance) {
            return undefined;
        }
        return this.extractMetadata(instance, metadataKey);
    }

    extractMetadata(
        instance: Record<string, any>,
        metadataKey: string,
    ): Type<any> | undefined {
        if (!instance.constructor) {
            return;
        }

        const metadata = Reflect.getMetadata(metadataKey, instance.constructor);
        return metadata ? (instance.constructor as Type<any>) : undefined;
    }
}
