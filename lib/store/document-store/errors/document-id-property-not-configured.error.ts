export class DocumentIdPropertyNotConfiguredError extends Error {
  constructor(documentType: string) {
    super(
      `@Document of type ${documentType} has no @DocumentId property configured.`,
    );
  }
}
