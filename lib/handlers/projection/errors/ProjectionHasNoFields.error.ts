export class ProjectionHasNoFieldsError extends Error {
  constructor(projectionType: string) {
    super(`projection of type ${projectionType} has no @ProjectionField's`);
  }
}
