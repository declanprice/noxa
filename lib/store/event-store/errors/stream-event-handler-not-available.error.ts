export class StreamEventHandlerNotAvailableError extends Error {
  constructor(streamType: string, eventType: string) {
    super(
      `@Stream of type ${streamType} has no @StreamEventHandler for event type ${eventType}`,
    );
  }
}
