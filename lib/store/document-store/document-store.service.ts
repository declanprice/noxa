import { Pool, PoolClient } from 'pg';
import { Injectable, Optional, Type } from '@nestjs/common';
import { toSnakeCase } from '../../util/to-snake-case';
import { DocumentNotFoundError } from './errors/document-not-found.error';
import { DOCUMENT_ID_PROPERTY_METADATA } from './document/document.decorators';
import { DocumentIdPropertyNotConfiguredError } from './errors/document-id-property-not-configured.error';
import { InjectStoreConnection } from '../store-connection.token';

@Injectable()
export class DocumentStore {
  constructor(
    @InjectStoreConnection()
    private readonly connection: PoolClient | Pool,
  ) {
    console.log('document store-session was created');
  }

  async get<T>(document: Type<T>, documentId: string): Promise<T> {
    try {
      const documentType = document.name;

      const documentResult = await this.connection.query({
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
      if (!(this.connection instanceof Pool)) {
        await this.connection.query('ROLLBACK');
        this.connection.release();
      }
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

      await this.connection.query({
        text: `insert into ${DocumentStore.getDocumentTableNameFromObject(
          document,
        )} (
           "id",
           "data",
           "lastModified"
      ) values ($1, $2, $3) 
        on conflict (id) do update set
        data = excluded.data,
        "lastModified" = excluded."lastModified"`,
        values: [documentId, document, new Date().toISOString()],
      });
    } catch (error) {
      if (!(this.connection instanceof Pool)) {
        await this.connection.query('ROLLBACK');
        this.connection.release();
      }
      throw error;
    }
  }

  async delete(document: Type, documentId: string): Promise<void> {
    try {
      await this.connection.query({
        text: `delete from ${DocumentStore.getDocumentTableNameFromType(
          document,
        )} where id = $1`,
        values: [documentId],
      });
    } catch (error) {
      if (!(this.connection instanceof Pool)) {
        await this.connection.query('ROLLBACK');
        this.connection.release();
      }
      throw error;
    }
  }

  static async createResources(document: Type, connection: PoolClient) {
    let tableName = DocumentStore.getDocumentTableNameFromType(document);

    await connection.query({
      text: `
        CREATE TABLE IF NOT EXISTS ${tableName} (
        "id" uuid not null constraint ${tableName}_pk primary key,
        "data" jsonb not null,
        "lastModified" timestamptz default now() not null
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
