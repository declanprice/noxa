export class EventStreamNotFoundError extends Error {
  constructor(eventStreamType: string, eventStreamId: string) {
    super(
      `@EventStream of type ${eventStreamType}:${eventStreamId} not found.`,
    );
  }
}
