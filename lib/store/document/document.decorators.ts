import { Type } from '@nestjs/common';

export const DOCUMENT_OPTIONS_METADATA = 'DOCUMENT_OPTIONS_METADATA';
export const DOCUMENT_ID_FIELD_METADATA = 'DOCUMENT_ID_FIELD_METADATA';
export const DOCUMENT_FIELD_METADATA = 'DOCUMENT_FIELD_METADATA';
export const DOCUMENT_FIELDS_METADATA = 'DOCUMENT_FIELDS_METADATA';

export enum DocumentFieldType {
    String,
    Number,
    Boolean,
    Array,
    Object,
}

export type DocumentFieldOptions = {
    type?: DocumentFieldType;
};

export type DocumentFields = Set<string>;

export type DocumentOptions = {
    optimistic?: boolean;
    indexes?: any[];
};

export const Document = (options?: DocumentOptions): ClassDecorator => {
    return (target: object) => {
        Reflect.defineMetadata(DOCUMENT_OPTIONS_METADATA, options, target);
    };
};

export const DocumentId = (
    options?: DocumentFieldOptions,
): PropertyDecorator => {
    return (target: object, propertyKey: string | symbol) => {
        Reflect.defineMetadata(
            DOCUMENT_ID_FIELD_METADATA,
            propertyKey,
            target.constructor,
        );
        addDocumentFieldMetadata(
            target.constructor as Type,
            propertyKey as string,
        );
    };
};

export const DocumentField = (
    options?: DocumentFieldOptions,
): PropertyDecorator => {
    return (target: object, propertyKey: string | symbol) => {
        addDocumentFieldMetadata(
            target.constructor as Type,
            propertyKey as string,
        );
    };
};

const addDocumentFieldMetadata = (target: Type, propertyKey: string) => {
    const fields: Set<string> =
        Reflect.getMetadata(DOCUMENT_FIELDS_METADATA, target) ||
        new Set<string>();
    fields.add(propertyKey);
    Reflect.defineMetadata(DOCUMENT_FIELDS_METADATA, fields, target);
    Reflect.defineMetadata(DOCUMENT_FIELD_METADATA, propertyKey, target);
};

export const getDocumentOptionsMetadata = (target: Type): DocumentOptions => {
    const metadata = Reflect.getMetadata(DOCUMENT_OPTIONS_METADATA, target);

    if (!metadata) {
        throw new Error(
            `document ${target.name} has no document options metadata.`,
        );
    }

    return metadata;
};

export const getDocumentIdFieldMetadata = (target: Type): string => {
    const metadata: string = Reflect.getMetadata(
        DOCUMENT_ID_FIELD_METADATA,
        target,
    );

    if (!metadata) {
        throw new Error(
            `document ${target.name} has no document id field metadata.`,
        );
    }

    return metadata;
};

export const getDocumentFieldsMetadata = (target: Type): DocumentFields => {
    const metadata: Set<string> = Reflect.getMetadata(
        DOCUMENT_FIELDS_METADATA,
        target,
    );

    if (!metadata) {
        throw new Error(
            `document ${target.name} has no document fields metadata.`,
        );
    }

    return metadata;
};
