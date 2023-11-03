import { Inject, Type } from '@nestjs/common';
import {
    getProcessDocumentMetadata,
    getProcessEventHandlerMetadata,
} from './process.decorators';
import { DocumentStore, StoreSession } from '../../store';
import { BusMessage } from '../../bus';
import { Session } from '../../store/session/store-session.service';
import { ProcessDocument } from './process.document';
import { getDocumentIdFieldMetadata } from '../../store/document/document/document.decorators';
import { DocumentInvalidIdError } from '../../store/document/errors/document-invalid-id.error';

export abstract class HandleProcess {
    session!: Session;

    constructor(
        @Inject(StoreSession) private readonly storeSession: StoreSession,
    ) {}

    async handle(message: BusMessage): Promise<void> {
        const processDocumentType = getProcessDocumentMetadata(
            this.constructor as Type,
        );

        this.session = await this.storeSession.start();

        try {
            const handlerMetadata = getProcessEventHandlerMetadata(
                this.constructor,
                message.type,
            );

            const associationId = handlerMetadata.associationId(message.data);

            const processDocuments: ProcessDocument[] = [];

            const processDocumentRows = await this.session.document.rawQuery({
                text: `select * from ${DocumentStore.tableNameFromType(
                    processDocumentType,
                )} where data -> 'associations' @> '["${associationId}"]'`,
                values: [],
            });

            for (const row of processDocumentRows) {
                processDocuments.push(new processDocumentType(row.data));
            }

            if (!processDocuments.length && handlerMetadata.start === true) {
                await this.handleProcessMessage(
                    processDocumentType,
                    undefined,
                    message,
                );
            }

            for (const processDocument of processDocuments) {
                await this.handleProcessMessage(
                    processDocumentType,
                    processDocument,
                    message,
                );
            }

            await this.session.commit();
        } catch (error) {
            await this.session.rollback();
            throw error;
        } finally {
            this.session.release();
        }
    }

    private async handleProcessMessage(
        processDocumentType: Type,
        processDocument: ProcessDocument | undefined,
        message: BusMessage,
    ): Promise<void> {
        if (!this.session) {
            throw new Error('invalid process session, cannot handle message');
        }

        const targetEventHandler = getProcessEventHandlerMetadata(
            this.constructor as any,
            message.type,
        );

        // apply event over projection instance
        const updatedDocument = await (this as any)[
            targetEventHandler.propertyKey
        ](message.data, processDocument);

        if (updatedDocument?.processEnded) {
            const documentIdProperty =
                getDocumentIdFieldMetadata(updatedDocument);
            const documentId = (processDocument as any)[documentIdProperty];
            if (!documentId) {
                throw new DocumentInvalidIdError();
            }
            await this.session.document.delete(processDocumentType, documentId);
        } else {
            await this.session.document.store(updatedDocument);
        }
    }
}
