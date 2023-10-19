import { ModuleRef } from '@nestjs/core';
import { Injectable, Logger, Type } from '@nestjs/common';
import {
  HandleEvent,
  ProcessLifeCycle,
  Event,
  SagaLifeCycle,
} from '../../handlers';
import { BusRelay, InjectBusRelay } from '../bus-relay.type';
import { Config, InjectConfig } from '../../config';
import {
  EVENT_HANDLER_METADATA,
  EVENT_HANDLER_OPTIONS_METADATA,
  EventHandlerOptions,
} from '../../handlers/event/event-handler.decorator';
import { BusMessage } from '../bus-message.type';
import { GroupCannotHandleEventTypeError } from './errors/group-cannot-handle-event-type.error';
import {
  getProcessEventTypesMetadata,
  getProcessOptionMetadata,
} from '../../handlers/process/process.decorators';
import {
  getSagaEventTypes,
  getSagaOptionMetadata,
} from '../../handlers/saga/saga.decorators';
import { Saga } from '../../../dist/lib/handlers/saga/saga';

@Injectable({})
export class EventBus {
  logger = new Logger(EventBus.name);

  constructor(
    @InjectBusRelay()
    private readonly busRelay: BusRelay,
    @InjectConfig()
    private readonly config: Config,
    private readonly moduleRef: ModuleRef,
  ) {}

  async send(
    event: Event,
    options: { tenantId?: string; publishAt?: Date },
  ): Promise<void> {
    const { tenantId, publishAt } = options;

    await this.busRelay.sendEvent({
      type: this.getEventName(event),
      fromContext: this.config.context,
      toContext: null,
      tenantId: tenantId ? tenantId : 'DEFAULT',
      timestamp: publishAt ? publishAt.toISOString() : new Date().toISOString(),
      data: event,
    });
  }

  async registerEventHandlers(handlers: Type<HandleEvent>[] = []) {
    const eventHandlerGroups = new Map<
      string,
      { consumerType: any; handlers: Map<string, HandleEvent> }
    >();

    for (const handler of handlers) {
      const event: Type<Event> = Reflect.getMetadata(
        EVENT_HANDLER_METADATA,
        handler,
      );

      const instance = this.moduleRef.get(handler, { strict: false });

      if (!instance) {
        throw new Error(
          `module ref could not resolve ${handler}, make sure it has been provided`,
        );
      }

      const options = Reflect.getMetadata(
        EVENT_HANDLER_OPTIONS_METADATA,
        handler,
      ) as EventHandlerOptions;

      let groupName = options.group ? options.group : handler.name;

      let eventHandlerGroup = eventHandlerGroups.get(groupName);

      if (eventHandlerGroup) {
        eventHandlerGroup.handlers.set(event.name, instance);
      } else {
        const handlers = new Map<string, HandleEvent>();
        handlers.set(event.name, instance);
        eventHandlerGroups.set(groupName, {
          consumerType: options.consumerType,
          handlers,
        });
      }
    }

    for (const [groupName, group] of eventHandlerGroups) {
      const handleEvent = async (message: BusMessage): Promise<void> => {
        const handler = group.handlers.get(message.type);

        if (!handler) {
          throw new GroupCannotHandleEventTypeError(groupName, message.type);
        }

        await handler.handle(message.data);
      };

      await this.busRelay.registerEventHandlerGroup(
        groupName,
        group.consumerType,
        Array.from(group.handlers.keys()),
        handleEvent,
      );
    }
  }

  async registerProcessHandlers(processes: Type<ProcessLifeCycle>[] = []) {
    for (const process of processes) {
      const instance = this.moduleRef.get(process, { strict: false });

      if (!instance) {
        throw new Error(
          `module ref could not resolve ${process}, make sure it has been provided`,
        );
      }

      const options = getProcessOptionMetadata(process);
      const eventTypes = getProcessEventTypesMetadata(process);
      const groupName = process.name;

      const handleEvent = async (message: BusMessage): Promise<void> => {
        await instance.handle(message);
      };

      await this.busRelay.registerEventHandlerGroup(
        groupName,
        options.consumerType,
        Array.from(eventTypes),
        handleEvent,
      );
    }
  }

  async registerSagaHandlers(
    sagaHandlers: Type<SagaLifeCycle>[] = [],
  ): Promise<void> {
    console.log(sagaHandlers);

    for (const saga of sagaHandlers) {
      const instance = this.moduleRef.get(saga, { strict: false });

      const options = getSagaOptionMetadata(saga);
      const eventTypes = getSagaEventTypes(saga);

      const groupName = saga.name;

      const handleEvent = async (message: BusMessage): Promise<void> => {
        await instance.handle(message);
      };

      await this.busRelay.registerEventHandlerGroup(
        groupName,
        options.consumerType,
        Array.from(eventTypes),
        handleEvent,
      );
    }
  }

  private getEventName(event: Event): string {
    const { constructor } = Object.getPrototypeOf(event);

    return constructor.name as string;
  }
}
