import { ModuleRef } from '@nestjs/core';
import { Injectable, Logger, Type } from '@nestjs/common';
import { HandleEvent } from '../../handlers';
import {
  EVENT_HANDLER_METADATA,
  EVENT_METADATA,
} from '../../handlers/constants';
import { BusImplementation } from '../bus-implementation.type';
import { InjectNoxaBus, InjectNoxaConfig } from '../../tokens';
import { EventMetadata } from '../../handlers/event/event-metadata.type';
import { Outbox } from './outbox.service';
import { NoxaConfig } from '../../noxa.module';

@Injectable({})
export class EventBus {
  private handlers = new Map<string, HandleEvent<Event>>();

  logger = new Logger(EventBus.name);

  constructor(
    @InjectNoxaBus()
    private readonly busImpl: BusImplementation,
    @InjectNoxaConfig()
    private readonly config: NoxaConfig,
    private readonly outbox: Outbox,
    private readonly moduleRef: ModuleRef,
  ) {}

  invoke(event: Event) {
    const eventId = this.getEventId(event);

    const handler = this.handlers.get(eventId);

    if (!handler) {
      const eventName = this.getEventName(event);
      throw new Error(`event handler not found for ${eventName}`);
    }

    return handler.handle(event);
  }

  async sendEvent(
    event: Event,
    options: { toContext?: string; tenantId?: string; publishAt?: Date },
  ): Promise<void> {
    const { toContext, tenantId, publishAt } = options;

    await this.busImpl.sendCommand({
      bus: 'event',
      type: this.getEventName(event),
      fromContext: toContext ? toContext : this.config.context,
      tenantId: tenantId ? tenantId : 'DEFAULT',
      timestamp: publishAt ? publishAt.toISOString() : new Date().toISOString(),
      data: event,
    });
  }

  async publish(
    event: Event,
    options: { toContext?: string; tenantId?: string; publishAt?: Date },
  ): Promise<void> {
    const { toContext, tenantId, publishAt } = options;

    await this.outbox.publish({
      bus: 'event',
      type: this.getEventName(event),
      fromContext: toContext ? toContext : this.config.context,
      tenantId: tenantId ? tenantId : 'DEFAULT',
      timestamp: publishAt ? publishAt.toISOString() : new Date().toISOString(),
      data: event,
    });
  }

  async register(handlers: Type<HandleEvent>[] = []) {
    for (const handler of handlers) {
      await this.registerHandler(handler);
    }
  }

  protected async registerHandler(handler: Type<HandleEvent>) {
    const instance = this.moduleRef.get(handler, { strict: false });

    if (!instance) {
      return;
    }

    const target = this.reflectEventId(handler);

    if (!target) {
      throw new Error('invalid event handler');
    }

    this.handlers.set(target, instance);

    await this.busImpl.registerEventHandler(instance);
  }

  private getEventName(event: Event): string {
    const { constructor } = Object.getPrototypeOf(event);

    return constructor.name as string;
  }

  private getEventId(event: Event): string {
    const { constructor: eventType } = Object.getPrototypeOf(event);

    const eventMetadata: EventMetadata = Reflect.getMetadata(
      EVENT_METADATA,
      eventType,
    );

    if (!eventMetadata) {
      throw new Error(`event handler for event ${eventType} not found`);
    }

    return eventMetadata.id;
  }

  private reflectEventId(handler: Type<HandleEvent>): string | undefined {
    const event: Event = Reflect.getMetadata(EVENT_HANDLER_METADATA, handler);

    const eventMetadata: EventMetadata = Reflect.getMetadata(
      EVENT_METADATA,
      event,
    );

    return eventMetadata.id;
  }
}
