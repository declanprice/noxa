import { Type } from '@nestjs/common';
import {
    getProcessDocumentMetadata,
    getProcessEventHandlerMetadata,
} from './process.decorators';
import { BusMessage } from '../../bus';
import { ProcessData } from './process.data';
import {
    InjectDatabase,
    DatabaseSession,
    DataStore,
    EventStore,
    OutboxStore,
} from '../../store';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export abstract class HandleProcess {
    session!: DatabaseSession;

    constructor(@InjectDatabase() private readonly db: NodePgDatabase<any>) {}

    async handle(message: BusMessage): Promise<void> {
        const processDocumentType = getProcessDocumentMetadata(
            this.constructor as Type,
        );

        await this.db.transaction(async (tx) => {
            this.session = {
                data: new DataStore(tx),
                event: new EventStore(tx),
                outbox: new OutboxStore(tx),
            };

            const handlerMetadata = getProcessEventHandlerMetadata(
                this.constructor,
                message.type,
            );

            const associationId = handlerMetadata.associationId(message.data);

            const processData: ProcessData[] = [];

            // const processRows = await t;

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
        });
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

        // if (updatedData?.hasEnded) {
        //     await this.session.data.delete(processes, updatedData.id);
        // } else {
        //     await this.session.data.store(processes, {
        //         id: updatedData.id,
        //         data: updatedData,
        //         type: this.constructor.name,
        //         associations: updatedData.associations,
        //         hasEnded: updatedData.hasEnded,
        //     });
        // }
    }
}
