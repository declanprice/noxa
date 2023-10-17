import { ModuleRef } from '@nestjs/core';
import { Injectable, Logger, Type } from '@nestjs/common';
import { HandleEvent } from '../../handlers';
import { BusRelay, InjectBusRelay } from '../bus-relay.type';
import { Config, InjectConfig } from '../../config';
import {
  EVENT_HANDLER_METADATA,
  EVENT_HANDLER_OPTIONS_METADATA,
  EventHandlerOptions,
} from '../../handlers/event/event-handler.decorator';

@Injectable({})
export class EventBus {
  // Map<eventType, HandleEvent>
  private handlers = new Map<string, HandleEvent<Event>>();

  logger = new Logger(EventBus.name);

  constructor(
    @InjectBusRelay()
    private readonly busRelay: BusRelay,
    @InjectConfig()
    private readonly config: Config,
    private readonly moduleRef: ModuleRef,
  ) {}

  invoke(event: Event) {
    const eventName = this.getEventName(event);

    const handler = this.handlers.get(eventName);

    if (!handler) {
      throw new Error(`event handler not found for ${eventName}`);
    }

    return handler.handle(event);
  }

  async sendEvent(
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

  async register(handlers: Type<HandleEvent>[] = []) {
    const eventHandlerGroups = new Map<
      string,
      { consumerType: any; handlers: Map<string, HandleEvent> }
    >();

    for (const handler of handlers) {
      const { eventType, handlerInstance } =
        await this.registerHandler(handler);

      const options = Reflect.getMetadata(
        EVENT_HANDLER_OPTIONS_METADATA,
        handler,
      ) as EventHandlerOptions;

      let groupName = options.group ? options.group : handler.name;

      let eventHandlerGroup = eventHandlerGroups.get(groupName);

      if (eventHandlerGroup) {
        eventHandlerGroup.handlers.set(eventType, handlerInstance);
      } else {
        const handlers = new Map<string, HandleEvent>();
        handlers.set(eventType, handlerInstance);
        eventHandlerGroups.set(groupName, {
          consumerType: options.consumerType,
          handlers,
        });
      }
    }

    for (const [groupName, group] of eventHandlerGroups) {
      await this.busRelay.registerEventHandlerGroup(
        groupName,
        group.consumerType,
        group.handlers,
      );
    }
  }

  protected async registerHandler(
    handler: Type<HandleEvent>,
  ): Promise<{ eventType: string; handlerInstance: HandleEvent }> {
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

    this.handlers.set(event.name, instance);

    return {
      eventType: event.name,
      handlerInstance: instance,
    };
  }

  private getEventName(event: Event): string {
    const { constructor } = Object.getPrototypeOf(event);

    return constructor.name as string;
  }
}
