import { Injectable, Type } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { Module } from '@nestjs/core/injector/module';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

import { HandleCommand } from './command/handle-command.type';
import {
  COMMAND_HANDLER_METADATA,
  EVENT_HANDLER_METADATA,
  QUERY_HANDLER_METADATA,
} from './constants';
import { HandleEvent } from './event/handle-event.type';
import { HandleQuery } from './query/handle-query.type';
import { EVENT_STREAM_PROJECTION_HANDLER } from '../event-stream-projection/event-stream-projection.decorators';

export type HandlerOptions = {
  commandHandlers?: Type<HandleCommand>[];
  queryHandlers?: Type<HandleQuery>[];
  eventHandlers?: Type<HandleEvent>[];
  projectionHandlers?: Type[];
};

@Injectable()
export class HandlerExplorer {
  constructor(private readonly modulesContainer: ModulesContainer) {}

  explore(): HandlerOptions {
    const modules = [...this.modulesContainer.values()];

    const commandHandlers = this.flatMap<HandleCommand>(modules, (instance) =>
      this.filterProvider(instance, COMMAND_HANDLER_METADATA),
    );

    const queryHandlers = this.flatMap<HandleQuery>(modules, (instance) =>
      this.filterProvider(instance, QUERY_HANDLER_METADATA),
    );

    const eventHandlers = this.flatMap<HandleEvent>(modules, (instance) =>
      this.filterProvider(instance, EVENT_HANDLER_METADATA),
    );

    const projectionHandlers = this.flatMap<any>(modules, (instance) =>
      this.filterProvider(instance, EVENT_STREAM_PROJECTION_HANDLER),
    );

    return {
      commandHandlers,
      queryHandlers,
      eventHandlers,
      projectionHandlers,
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
