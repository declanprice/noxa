export class EventStreamNoEventsFoundError extends Error {
  constructor(eventStreamType: string, eventStreamId: string) {
    super(
      `@EventStream of type ${eventStreamType}:${eventStreamId} has no events.`,
    );
  }
}
