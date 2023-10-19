import { Pool, PoolClient } from 'pg';
import { Injectable, Type } from '@nestjs/common';
import { toSnakeCase } from '../../util/to-snake-case';
import { DocumentNotFoundError } from './errors/document-not-found.error';
import { InjectStoreConnection } from '../store-connection.token';
import { StoredDocument } from './document/stored-document.type';

@Injectable()
export class DocumentStore {
  constructor(
    @InjectStoreConnection()
    private readonly connection: PoolClient | Pool,
  ) {}

  async rawQuery<T>(query: { text: string; values: any[] }): Promise<T[]> {
    const { rows } = await this.connection.query(query);
    return rows;
  }

  async get<T>(document: Type<T>, documentId: string): Promise<T> {
    const documentType = document.name;

    const documentResult = await this.connection.query({
      text: `select * from ${DocumentStore.tableNameFromType(
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
  }

  async find<T>(document: Type<T>, documentId: string): Promise<T | null> {
    const documentResult = await this.connection.query({
      text: `select * from ${DocumentStore.tableNameFromType(
        document,
      )} where id = $1`,
      values: [documentId],
    });

    if (documentResult.rowCount === 0) {
      return null;
    }

    const _document: T = new document();

    Object.assign(_document as any, documentResult.rows[0].data);

    return _document;
  }

  async store<D>(
    document: Type<D>,
    documentId: string,
    data: D,
  ): Promise<StoredDocument> {
    const { rows } = await this.connection.query({
      text: `insert into ${DocumentStore.tableNameFromType(document)} (
           "id",
           "data",
           "lastModified"
      ) values ($1, $2, $3) 
        on conflict (id) do update set
        data = excluded.data,
        "lastModified" = excluded."lastModified" returning *`,
      values: [documentId, data, new Date().toISOString()],
    });

    return rows[0] as StoredDocument;
  }

  async delete(document: Type, documentId: string): Promise<void> {
    await this.connection.query({
      text: `delete from ${DocumentStore.tableNameFromType(
        document,
      )} where id = $1`,
      values: [documentId],
    });
  }

  static async createResources(document: Type, connection: PoolClient) {
    let tableName = DocumentStore.tableNameFromType(document);

    await connection.query({
      text: `
        CREATE TABLE IF NOT EXISTS ${tableName} (
        "id" uuid not null constraint ${tableName}_pk primary key,
        "data" jsonb not null,
        "lastModified" timestamptz default now() not null
    )`,
    });
  }

  static tableNameFromType = (document: Type) => {
    return `noxa_docs_${toSnakeCase(document.name)}`;
  };

  static tableNameFromInstance = (document: Object) => {
    return `noxa_docs_${toSnakeCase(document.constructor.name)}`;
  };
}
