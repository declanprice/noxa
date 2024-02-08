export class ProjectionUnsupportedEventError extends Error {
    constructor(projectionType: string, eventType: string) {
        super(
            `@Projection of type ${projectionType} cannot handle event of type ${eventType}`,
        );
    }
}
