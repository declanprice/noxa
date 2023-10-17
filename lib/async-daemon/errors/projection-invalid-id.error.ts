export class ProjectionInvalidIdError extends Error {
  constructor() {
    super(
      `@EventStreamHandler must point to a valid string identifier for document, eg: (e) => e.customerId.`,
    );
  }
}
