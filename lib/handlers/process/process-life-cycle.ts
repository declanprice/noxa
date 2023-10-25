import { Inject, Type } from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  getProcessDocumentMetadata,
  getProcessEventHandlerMetadata,
} from './process.decorators';
import { DocumentStore, StoreSession } from '../../store';
import { BusMessage } from '../../bus';
import { Session } from '../../store/store-session/store-session.service';
import { StoredDocument } from '../../store/document-store/document/stored-document.type';

export abstract class ProcessLifeCycle {
  private tableName = DocumentStore.tableNameFromInstance(this);

  session!: Session;

  constructor(
    @Inject(StoreSession) private readonly storeSession: StoreSession,
  ) {}

  async handle(message: BusMessage): Promise<void> {
    const documentType = getProcessDocumentMetadata(this.constructor as Type);

    this.session = await this.storeSession.start();

    try {
      const handlerMetadata = getProcessEventHandlerMetadata(
        this.constructor,
        message.type,
      );

      const associationId = handlerMetadata.associationId(message.data);

      const processDocuments: StoredDocument[] =
        await this.session.document.rawQuery({
          text: `select * from ${this.tableName} where data-> 'associations' @> '["${associationId}"]'`,
          values: [],
        });

      if (!processDocuments.length && handlerMetadata.start === true) {
        processDocuments.push(
          await this.startNewProcess(documentType, associationId),
        );
      }

      for (const process of processDocuments) {
        await this.handleProcessMessage(documentType, process, message);
      }

      await this.session.commit();
    } catch (error) {
      await this.session.rollback();
      throw error;
    } finally {
      this.session.release();
    }
  }

  private async startNewProcess(
    documentType: Type,
    associationId: string,
  ): Promise<StoredDocument> {
    if (!this.session) {
      throw new Error(
        'invalid process session, cannot start new process instance',
      );
    }

    return await this.session.document.store(documentType, randomUUID(), {
      associations: [associationId],
    });
  }

  private async handleProcessMessage(
    documentType: Type,
    document: StoredDocument,
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
    const updatedDocument = await (this as any)[targetEventHandler.propertyKey](
      message.data,
      document.data,
    );

    if (updatedDocument?.processEnded) {
      await this.session.document.delete(documentType, document.id);
    } else {
      await this.session.document.store(
        documentType,
        document.id,
        updatedDocument,
      );
    }
  }
}
