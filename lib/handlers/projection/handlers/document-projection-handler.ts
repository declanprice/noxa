import { Type } from '@nestjs/common';
import { Pool } from 'pg';
import { ProjectionHandler } from './projection-handler';
import { StoredProjectionToken } from '../stored-projection-token';
import { ProjectionUnsupportedEventError } from '../../../async-daemon/errors/projection-unsupported-event.error';
import { ProjectionInvalidIdError } from '../../../async-daemon/errors/projection-invalid-id.error';
import { DocumentStore } from '../../../store';
import { StoredEvent } from '../../../store/event/event/stored-event.type';
import { getDocumentIdFieldMetadata } from '../../../store/document/document/document.decorators';
import { getProjectionDocumentMetadata } from '../projection.decorators';

export class DocumentProjectionHandler extends ProjectionHandler {
    constructor(private readonly documentStore: DocumentStore) {
        super();
    }

    async handleEvents(
        connection: Pool,
        projection: any,
        projectionType: Type,
        events: StoredEvent[],
    ): Promise<StoredProjectionToken> {
        const documentType = getProjectionDocumentMetadata(projectionType);

        const documentIds = this.getTargetDocumentIds(projectionType, events);

        const documents = await this.documentStore.findMany(
            documentType,
            documentIds,
        );

        const transaction = await connection.connect();

        try {
            this.applyEvents(projection, documentType, documents, events);

            await this.documentStore.storeMany(documents, { transaction });

            return await this.updateTokenPosition(
                transaction,
                projectionType,
                events[events.length - 1].sequenceId,
            );
        } catch (error) {
            await transaction.query('ROLLBACK');
            throw error;
        } finally {
            transaction.release();
        }
    }

    private applyEvents(
        projection: any,
        documentType: Type,
        documents: any[],
        events: StoredEvent[],
    ) {
        const documentIdProperty = getDocumentIdFieldMetadata(documentType);

        for (const event of events) {
            const targetEventHandler = Reflect.getMetadata(
                event.type,
                projection.constructor,
            );

            if (!targetEventHandler) {
                throw new ProjectionUnsupportedEventError(
                    projection.constructor.name,
                    event.type,
                );
            }

            const targetDocumentId = targetEventHandler.id(event.data);

            const existingDocumentIndex: any = documents.findIndex(
                (d) => d[documentIdProperty] === targetDocumentId,
            );

            const updatedDocument = projection[targetEventHandler.propertyKey](
                event.data,
                documents[existingDocumentIndex],
            );

            if (existingDocumentIndex !== -1) {
                documents[existingDocumentIndex] = updatedDocument;
            } else {
                documents.push(updatedDocument);
            }
        }
    }

    private getTargetDocumentIds(
        projectionType: Type,
        events: StoredEvent[],
    ): string[] {
        const documentIds: Set<string> = new Set<string>();

        for (const event of events) {
            const targetEventHandler = Reflect.getMetadata(
                event.type,
                projectionType,
            );

            if (!targetEventHandler) {
                throw new ProjectionUnsupportedEventError(
                    projectionType.name,
                    event.type,
                );
            }

            const id = targetEventHandler.id(event.data);

            if (typeof id !== 'string') {
                throw new ProjectionInvalidIdError();
            }

            documentIds.add(id);
        }

        return Array.from(documentIds);
    }
}
