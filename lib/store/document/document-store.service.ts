import { Pool, PoolClient } from 'pg';
import format = require('pg-format');
import { Injectable, Type } from '@nestjs/common';
import { toSnakeCase } from '../../util/to-snake-case';
import { InjectStoreConnection } from '../store-connection.token';
import { DocumentRow } from './document-row.type';
import {
    getDocumentFieldsMetadata,
    getDocumentIdFieldMetadata,
} from './document.decorators';
import { DocumentInvalidIdError } from './errors/document-invalid-id.error';
import { DocumentNotFoundError } from './errors/document-not-found.error';
import { DocumentQueryBuilder } from './document-query-builder';

@Injectable()
export class DocumentStore {
    constructor(
        @InjectStoreConnection()
        private readonly connection: PoolClient | Pool,
    ) {}

    async rawQuery<T>(query: {
        text: string;
        values: any[];
    }): Promise<DocumentRow[]> {
        const { rows } = await this.connection.query(query);
        return rows;
    }

    query<T>(document: Type<T>): DocumentQueryBuilder<Type<T>> {
        return new DocumentQueryBuilder(document, this.connection as Pool);
    }

    async get<T>(document: Type<T>, documentId: string): Promise<T> {
        const documentResult = await this.connection.query({
            text: `select * from ${DocumentStore.tableNameFromType(
                document,
            )} where id = $1`,
            values: [documentId],
        });

        if (documentResult.rowCount === 0) {
            throw new DocumentNotFoundError();
        }

        return new document(documentResult.rows[0].data);
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

        return new document(documentResult.rows[0].data);
    }

    async findMany<T>(document: Type<T>, documentIds: string[]): Promise<T[]> {
        const { rows } = await this.connection.query(
            format(
                `select * from ${DocumentStore.tableNameFromType(
                    document,
                )} where id IN (%L)`,
                Array.from(documentIds),
            ),
        );

        return rows.map((r: DocumentRow) => {
            return new document(r.data);
        });
    }

    async store(
        document: any,
        options: { transaction?: PoolClient } = {},
    ): Promise<void> {
        const { transaction } = options;

        const { id, data, lastModified } = this.toStoredDocument(document);

        const connection = transaction ? transaction : this.connection;

        await connection.query({
            text: `insert into ${DocumentStore.tableNameFromInstance(
                document,
            )} (
           "id",
           "data",
           "lastModified"
      ) values ($1, $2, $3)
        on conflict (id) do update set
        data = excluded.data,
        "lastModified" = excluded."lastModified" returning *`,
            values: [id, data, lastModified],
        });
    }

    async storeMany(
        documents: any[],
        options: { transaction?: PoolClient } = {},
    ): Promise<void> {
        const { transaction } = options;

        const connection = transaction ? transaction : this.connection;

        if (!documents.length) {
            throw new Error(
                'you must provide at least one valid document to store',
            );
        }

        const firstDocType = documents[0].constructor;

        const allSameDocType = documents.every(
            (v) => v.constructor.name === firstDocType.name,
        );

        if (!allSameDocType) {
            throw new Error('all documents must be the same type of ${}');
        }

        const storedDocuments: DocumentRow[] = documents.map(
            this.toStoredDocument,
        );

        await connection.query(
            format(
                `insert into ${DocumentStore.tableNameFromType(
                    firstDocType,
                )} (id, data, "lastModified") values %L
            on conflict (id) do update set
            data = excluded.data,
            "lastModified" = excluded."lastModified"`,
                storedDocuments.map((v) => [v.id, v.data, v.lastModified]),
            ),
        );
    }

    async delete(
        document: Type,
        documentId: string,
        options: { transaction?: PoolClient } = {},
    ): Promise<void> {
        const { transaction } = options;

        const connection = transaction ? transaction : this.connection;

        await connection.query({
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
                "lastModified" timestamptz default now() not null)
            `,
        });

        await connection.query({
            text: `CREATE INDEX IF NOT EXISTS ${tableName}_data_index ON ${tableName} USING gin(data jsonb_path_ops)`,
        });
    }

    static tableNameFromType = (document: Type) => {
        return `noxa_docs_${toSnakeCase(document.name)}`;
    };

    static tableNameFromInstance = (document: Object) => {
        return `noxa_docs_${toSnakeCase(document.constructor.name)}`;
    };

    private toStoredDocument = (document: any): DocumentRow => {
        const documentIdField = getDocumentIdFieldMetadata(
            document.constructor,
        );

        const documentFields = getDocumentFieldsMetadata(document.constructor);

        const documentId = document[documentIdField];

        const data: any = {};

        for (const field of documentFields) {
            data[field] = document[field];
        }

        if (!documentId || typeof documentId !== 'string') {
            throw new DocumentInvalidIdError();
        }

        return {
            id: documentId,
            lastModified: new Date().toISOString(),
            data,
        };
    };
}
