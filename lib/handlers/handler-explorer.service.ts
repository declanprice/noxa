import { Injectable, Type } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { Module } from '@nestjs/core/injector/module';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

import { HandleCommand } from './command/handle-command.type';
import { COMMAND_HANDLER_METADATA } from './constants';

export type HandlerOptions = {
  commandHandlers?: Type<HandleCommand>[];
};

@Injectable()
export class HandlerExplorer {
  constructor(private readonly modulesContainer: ModulesContainer) {}

  explore(): HandlerOptions {
    const modules = [...this.modulesContainer.values()];

    const commandHandlers = this.flatMap<HandleCommand>(modules, (instance) =>
      this.filterProvider(instance, COMMAND_HANDLER_METADATA),
    );

    return { commandHandlers };
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
