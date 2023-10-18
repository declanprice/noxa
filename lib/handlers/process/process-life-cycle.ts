import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  getProcessEventHandlerMetadata,
  getProcessFields,
  ProcessField,
} from './process.decorators';
import { DocumentStore, StoreSession } from '../../store';
import { BusMessage } from '../../bus';
import { Session } from '../../store/store-session/store-session.service';
import { StoredDocument } from '../../store/document-store/document/stored-document.type';

export abstract class ProcessLifeCycle {
  @ProcessField()
  private processEnded: boolean = false;

  @ProcessField()
  private associations: string[] = [];

  private tableName = DocumentStore.tableNameFromInstance(this);

  session!: Session;

  constructor(
    @Inject(StoreSession) private readonly storeSession: StoreSession,
  ) {}

  async handle(message: BusMessage): Promise<void> {
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
        processDocuments.push(await this.startNewProcess(associationId));
      }

      for (const process of processDocuments) {
        await this.handleProcessMessage(process, message);
      }

      await this.session.commit();
    } catch (error) {
      await this.session.rollback();
      throw error;
    } finally {
      this.session.release();
    }
  }

  associateWith(id: string): void {
    const indexOf = this.associations.indexOf(id);

    if (indexOf === -1) {
      this.associations.push(id);
    }
  }

  removeAssociation(id: string): void {
    const indexOf = this.associations.indexOf(id);

    if (indexOf !== -1) {
      this.associations.splice(indexOf, 1);
    }
  }

  end(): void {
    this.processEnded = true;
  }

  private async startNewProcess(
    associationId: string,
  ): Promise<StoredDocument> {
    if (!this.session) {
      throw new Error(
        'invalid process session, cannot start new process instance',
      );
    }

    return await this.session.document.store(
      this.constructor as any,
      randomUUID(),
      {
        associations: [associationId],
      },
    );
  }

  private async handleProcessMessage(
    processDocument: StoredDocument,
    message: BusMessage,
  ): Promise<void> {
    if (!this.session) {
      throw new Error('invalid process session, cannot handle message');
    }

    const processFields = getProcessFields(this.constructor as any);

    const targetEventHandler = getProcessEventHandlerMetadata(
      this.constructor as any,
      message.type,
    );

    // reset projection fields
    Object.keys(this).forEach((key) => {
      if (processFields.has(key)) {
        (this as any)[key] = undefined;
      }
    });

    // assign existing data to projection instance
    Object.assign(this, processDocument.data);

    // apply event over projection instance
    (this as any)[targetEventHandler.propertyKey](message.data);

    let updatedProcessData: any = {};

    Object.keys(this).forEach((key) => {
      if (processFields.has(key)) {
        updatedProcessData[key] = (this as any)[key];
      }
    });

    if (this.processEnded) {
      await this.session.document.delete(
        this.constructor as any,
        processDocument.id,
      );
    } else {
      await this.session.document.store(
        this.constructor as any,
        processDocument.id,
        updatedProcessData,
      );
    }
  }
}
