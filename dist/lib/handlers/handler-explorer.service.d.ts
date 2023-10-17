import { Type } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { Module } from '@nestjs/core/injector/module';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { HandleCommand } from './command/handle-command.type';
import { HandleEvent } from './event/handle-event.type';
import { HandleQuery } from './query/handle-query.type';
export type HandlerOptions = {
    commandHandlers?: Type<HandleCommand>[];
    queryHandlers?: Type<HandleQuery>[];
    eventHandlers?: Type<HandleEvent>[];
    projectionHandlers?: Type[];
};
export declare class HandlerExplorer {
    private readonly modulesContainer;
    constructor(modulesContainer: ModulesContainer);
    explore(): HandlerOptions;
    flatMap<T>(modules: Module[], callback: (instance: InstanceWrapper) => Type<any> | undefined): Type<T>[];
    filterProvider(wrapper: InstanceWrapper, metadataKey: string): Type<any> | undefined;
    extractMetadata(instance: Record<string, any>, metadataKey: string): Type<any> | undefined;
}
