export class ProjectionUnsupportedEventError extends Error {
  constructor(projectionType: string, eventType: string) {
    super(
      `event stream projection of type ${projectionType} cannot handle event of type ${eventType}`,
    );
  }
}
