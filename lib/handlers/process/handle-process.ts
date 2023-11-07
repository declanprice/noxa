import { Inject, Type } from '@nestjs/common';
import {
    getProcessDocumentMetadata,
    getProcessEventHandlerMetadata,
} from './process.decorators';
import { DataStore, StoreSession } from '../../store';
import { BusMessage } from '../../bus';
import { Session } from '../../store/session/store-session.service';
import { DocumentInvalidIdError } from '../../store/data/errors/document-invalid-id.error';
import { processes } from '../../schema/schema';
import { ProcessData } from './process.data';

export abstract class HandleProcess {
    session!: Session;

    constructor(
        @Inject(StoreSession) private readonly storeSession: StoreSession,
    ) {}

    async handle(message: BusMessage): Promise<void> {
        const processDocumentType = getProcessDocumentMetadata(
            this.constructor as Type,
        );

        // this.session = await this.storeSession.start();

        // try {
        const handlerMetadata = getProcessEventHandlerMetadata(
            this.constructor,
            message.type,
        );

        const associationId = handlerMetadata.associationId(message.data);

        const processData: ProcessData[] = [];

        // const processDocumentRows = await this.session.data.rawQuery({
        //     text: `select * from ${DocumentStore.tableNameFromType(
        //         processDocumentType,
        //     )} where data -> 'associations' @> '["${associationId}"]'`,
        //     values: [],
        // });

        // for (const row of processDocumentRows) {
        //     processDocuments.push(new processDocumentType(row.data));
        // }

        if (!processData.length && handlerMetadata.start === true) {
            await this.handleProcessMessage(undefined, message);
        }

        for (const data of processData) {
            await this.handleProcessMessage(data, message);
        }

        //     await this.session.commit();
        // } catch (error) {
        //     await this.session.rollback();
        //     throw error;
        // } finally {
        //     this.session.release();
        // }
    }

    private async handleProcessMessage(
        data: ProcessData | undefined,
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
        const updatedData = await (this as any)[targetEventHandler.propertyKey](
            message.data,
            data,
        );

        if (!(updatedData instanceof ProcessData)) {
            throw new Error(
                'must return valid process data from process handler',
            );
        }

        if (updatedData?.hasEnded) {
            await this.session.data.delete(processes, updatedData.id);
        } else {
            await this.session.data.store(processes, {
                id: updatedData.id,
                data: updatedData,
                type: this.constructor.name,
                associations: updatedData.associations,
                hasEnded: updatedData.hasEnded,
            });
        }
    }
}
