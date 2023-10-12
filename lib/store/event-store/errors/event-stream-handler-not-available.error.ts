export class EventStreamHandlerNotAvailableError extends Error {
  constructor(eventStreamType: string, eventType: string) {
    super(
      `@EventStream of type ${eventStreamType} has no @EventStreamHandler for event type ${eventType}`,
    );
  }
}
