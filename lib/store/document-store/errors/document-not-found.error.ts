export class DocumentNotFoundError extends Error {
  constructor(documentType: string, documentId: string) {
    super(`@Document of type ${documentType}:${documentId} not found.`);
  }
}
