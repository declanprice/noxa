import { Client, PoolClient } from 'pg';
import { Type } from '@nestjs/common';
import { toSnakeCase } from '../../util/to-snake-case';
import { DocumentNotFoundError } from './errors/document-not-found.error';
import { DOCUMENT_ID_PROPERTY_METADATA } from './document/document.decorators';
import { DocumentIdPropertyNotConfiguredError } from './errors/document-id-property-not-configured.error';
import { randomUUID } from 'crypto';

export class DocumentStore {
  constructor(private readonly client: PoolClient) {
    console.log('document store-session was created');
  }

  async get<T>(document: Type<T>, documentId: string): Promise<T> {
    try {
      const documentType = document.name;

      const documentResult = await this.client.query({
        text: `select * from ${DocumentStore.getDocumentTableNameFromType(
          document,
        )} where id = $1`,
        values: [documentId],
      });

      if (documentResult.rowCount === 0) {
        throw new DocumentNotFoundError(documentType, documentId);
      }

      const _document: T = new document();

      Object.assign(_document as any, documentResult.rows[0].data);

      return _document;
    } catch (error) {
      await this.client.query('ROLLBACK');
      this.client.release();
      throw error;
    }
  }

  async store(document: any): Promise<void> {
    try {
      const documentType = document.constructor.name;

      const documentIdProperty = Reflect.getMetadata(
        DOCUMENT_ID_PROPERTY_METADATA,
        document,
      );

      if (!documentIdProperty) {
        throw new DocumentIdPropertyNotConfiguredError(documentType);
      }

      const documentId = document[documentIdProperty];

      await this.client.query({
        text: `insert into ${DocumentStore.getDocumentTableNameFromObject(
          document,
        )} (
           id,
           data,
           last_modified
      ) values ($1, $2, $3) `,
        values: [documentId, document, new Date().toISOString()],
      });
    } catch (error) {
      await this.client.query('ROLLBACK');
      this.client.release();
      throw error;
    }
  }

  async delete(document: Type, documentId: string): Promise<void> {
    try {
      await this.client.query({
        text: `delete from ${DocumentStore.getDocumentTableNameFromType(
          document,
        )} where id = $1`,
        values: [documentId],
      });
    } catch (error) {
      await this.client.query('ROLLBACK');
      this.client.release();
      throw error;
    }
  }

  static async createResources(document: Type, client: PoolClient) {
    await client.query({
      text: `
        CREATE TABLE IF NOT EXISTS ${DocumentStore.getDocumentTableNameFromType(
          document,
        )} (
        id varchar not null,
        data jsonb not null,
        last_modified timestamptz default now() not null
    )`,
    });
  }

  static getDocumentTableNameFromType = (document: Type) => {
    return `noxa_docs_${toSnakeCase(document.name)}`;
  };

  static getDocumentTableNameFromObject = (document: Object) => {
    return `noxa_docs_${toSnakeCase(document.constructor.name)}`;
  };
}
