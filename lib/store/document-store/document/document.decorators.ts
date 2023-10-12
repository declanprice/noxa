export const DOCUMENT_METADATA = 'DOCUMENT_METADATA';
export const DOCUMENT_ID_PROPERTY_METADATA = 'DOCUMENT_ID_PROPERTY_METADATA';

export type DocumentOptions = {};

export const Document = (options?: DocumentOptions): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(DOCUMENT_METADATA, options, target);
  };
};

export const DocumentId = (options?: DocumentOptions): PropertyDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    Reflect.defineMetadata(DOCUMENT_ID_PROPERTY_METADATA, propertyKey, target);
  };
};
