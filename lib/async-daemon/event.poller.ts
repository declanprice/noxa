import { Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Pool } from 'pg';
import {
    getProjectionEventTypesMetadata,
    getProjectionOptionMetadata,
} from '../handlers/projection/projection.decorators';
import { StoredProjectionToken } from '../handlers/projection/stored-projection-token';
import { EventRow } from '../store/event/event/event-row.type';
import { DocumentProjectionHandler } from '../handlers/projection/handlers/document-projection-handler';
import { EventProjectionHandler } from '../handlers/projection/handlers/event-projection-handler';
import { DataStore } from '../store';

export class EventPoller {
    logger = new Logger(EventPoller.name);
    pollTimeInMs = 500;

    constructor(
        private readonly connection: Pool,
        private readonly moduleRef: ModuleRef,
        private readonly documentStore: DataStore,
    ) {}

    async start(projectionType: Type, type: 'document' | 'event') {
        const options = getProjectionOptionMetadata(projectionType);

        const eventTypes = getProjectionEventTypesMetadata(projectionType);

        const token = await this.getProjectionToken(projectionType.name);

        this.pollEvents(
            projectionType,
            type,
            Array.from(eventTypes),
            token,
        ).then();
    }

    async pollEvents(
        projectionType: Type,
        handlerType: 'document' | 'event',
        eventTypes: string[],
        token: StoredProjectionToken,
    ) {
        const events = await this.connection.query({
            text: `select * from noxa_events where "type" = ANY ($1) AND "sequenceId" > $2 order by "sequenceId" asc limit $3`,
            values: [eventTypes, token.lastSequenceId, 25000],
        });

        if (events.rowCount === 0) {
            return setTimeout(() => {
                this.pollEvents(
                    projectionType,
                    handlerType,
                    eventTypes,
                    token,
                ).then();
            }, this.pollTimeInMs);
        }

        this.logger.log(
            `${events.rowCount} events available, processing batch now.`,
        );

        let updatedToken: StoredProjectionToken;

        const beforeDate = Date.now();

        const documentProjectionHandler = new DocumentProjectionHandler(
            this.documentStore,
        );

        const eventProjectionHandler = new EventProjectionHandler();

        const projection = this.moduleRef.get(projectionType, {
            strict: false,
        });

        switch (handlerType) {
            case 'document':
                updatedToken = await documentProjectionHandler.handleEvents(
                    this.connection,
                    projection,
                    projectionType,
                    events.rows as EventRow[],
                );
                break;
            case 'event':
                updatedToken = await eventProjectionHandler.handleEvents(
                    this.connection,
                    projection,
                    projectionType,
                    events.rows as EventRow[],
                );
                break;
            default:
                this.logger.log(
                    'Projection type must be either [Document] or [Generic]',
                );
                break;
        }

        this.logger.log(
            `successfully processed batch of ${events.rowCount} in ${Math.abs(
                (beforeDate - Date.now()) / 1000,
            )} seconds., checking for more events in 1 second.`,
        );

        return setTimeout(() => {
            this.pollEvents(
                projectionType,
                handlerType,
                eventTypes,
                updatedToken,
            ).then();
        }, this.pollTimeInMs);
    }

    async getProjectionToken(name: string): Promise<StoredProjectionToken> {
        let storedToken!: StoredProjectionToken;

        const result = await this.connection.query({
            text: 'select * from noxa_projection_tokens where name = $1',
            values: [name],
        });

        if (result.rowCount === 0) {
            const { rows } = await this.connection.query({
                text: `insert into noxa_projection_tokens ("name", "lastSequenceId", "lastUpdated") values ($1, $2, $3) returning *`,
                values: [name, -1, new Date().toISOString()],
            });

            storedToken = rows[0];
        } else {
            storedToken = result.rows[0];
        }

        return storedToken;
    }
}
