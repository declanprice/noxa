import { Injectable, Type } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { Module } from '@nestjs/core/injector/module';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

import { HandleCommand } from './command/handle-command';
import { HandleEvent } from './event/handle-event';
import { HandleQuery } from './query/handle-query';
import { PROJECTION_HANDLER } from './projection/projection.decorators';
import { EVENT_HANDLER_TYPE } from './event/event-handler.decorator';
import { COMMAND_HANDLER_TYPE } from './command/command-handler.decorator';
import { QUERY_HANDLER_TYPE } from './query/query-handler.decorator';
import { HandleProcess } from './process';
import { PROCESS_METADATA } from './process/process.decorators';
import { EVENT_GROUP_HANDLER } from './event/group/event-group.decorator';
import { HandleProjection } from './projection';

export type HandlerOptions = {
    commandHandlers: Type<HandleCommand>[];
    queryHandlers: Type<HandleQuery>[];
    eventHandlers: Type<HandleEvent>[];
    eventGroupHandlers: Type[];
    projectionHandlers: Type[];
    processHandlers: Type[];
};

@Injectable()
export class HandlerExplorer {
    constructor(private readonly modulesContainer: ModulesContainer) {}

    explore(): HandlerOptions {
        const modules = [...this.modulesContainer.values()];

        const commandHandlers = this.flatMap<HandleCommand>(
            modules,
            (instance) => this.filterProvider(instance, COMMAND_HANDLER_TYPE),
        );

        const queryHandlers = this.flatMap<HandleQuery>(modules, (instance) =>
            this.filterProvider(instance, QUERY_HANDLER_TYPE),
        );

        const eventHandlers = this.flatMap<HandleEvent>(modules, (instance) =>
            this.filterProvider(instance, EVENT_HANDLER_TYPE),
        );

        const eventGroupHandlers = this.flatMap(modules, (instance) =>
            this.filterProvider(instance, EVENT_GROUP_HANDLER),
        );

        const projectionHandlers = this.flatMap<any>(modules, (instance) =>
            this.filterProvider(instance, PROJECTION_HANDLER),
        );

        const processHandlers = this.flatMap(modules, (instance) =>
            this.filterProvider(instance, PROCESS_METADATA),
        );

        return {
            commandHandlers,
            queryHandlers,
            eventHandlers,
            eventGroupHandlers,
            projectionHandlers,
            processHandlers,
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
