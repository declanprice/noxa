import { Inject, Type } from '@nestjs/common';
import { Command } from '../command/command.type';
import { Event } from '../event/event.type';
import { BusMessage } from '../../bus';
import { getSagaStartEvent, getSagaStartHandler } from './saga.decorators';
import {
    InvalidSagaDefinitionError,
    InvalidSagaStepDefinitionError,
} from './errors/invalid-saga-definition.error';
import { DatabaseSession } from '../../store/database-session.type';
import { SagaData } from './saga.document';
import { sagasTable } from '../../schema/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DataStore, InjectDatabase, OutboxStore } from '../../store';
import { InferSelectModel } from 'drizzle-orm';
import { PgTransaction } from 'drizzle-orm/pg-core/session';

export type SagaStepDefinition = {
    name: string;
    position: number;
    publishCommand?: {
        type: string;
        data: any;
    };
    withCompensationCommand?: {
        type: string;
        data: any;
    };
    andExpectEvent?: string;
};

export type SagaDefinition = {
    steps: SagaStepDefinition[];
    failOnEvents?: string[];
    failOnTimeout?: Date;
    completeOnStep?: number;
    currentStepIndex: number;
};

export abstract class HandleSaga {
    private sagaType = this.constructor as Type;

    constructor(
        @InjectDatabase() private readonly db: NodePgDatabase,
        @Inject(DataStore) private readonly dataStore: DataStore,
        @Inject(OutboxStore) private readonly outboxStore: OutboxStore,
    ) {}

    async handle(message: BusMessage): Promise<void> {
        const startEvent = getSagaStartEvent(this.sagaType);
        const startHandler = getSagaStartHandler(this.sagaType);

        const builder: SagaBuilder = (this as any)[startHandler](message.data);

        if (!builder) {
            throw new InvalidSagaDefinitionError(this.sagaType);
        }

        if (!builder.definition.steps.length) {
            console.log(
                `saga of type ${this.sagaType.name} has an invalid definition, cannot start instance.`,
            );
            return;
        }

        await this.db.transaction(async (tx) => {
            const sagaId = startEvent.associationId(message.data);

            if (startEvent.event.name === message.type) {
                await this.dataStore.store(
                    sagasTable,
                    {
                        id: sagaId,
                        timestamp: new Date(),
                        type: this.constructor.name,
                        definition: builder.definition,
                    },
                    {
                        tx,
                    },
                );

                const firstStep = builder.definition.steps.sort(
                    (s) => s.position,
                )[0];

                if (firstStep.publishCommand) {
                    await this.outboxStore.publishMessage(
                        'command',
                        firstStep.publishCommand.type,
                        firstStep.publishCommand.data,
                        { tx },
                    );
                }

                return console.log(
                    `started new saga instance ${this.sagaType.name}:${sagaId}.`,
                );
            }

            const saga = await this.dataStore.find(sagasTable, sagaId, {
                tx,
            });

            if (!saga) {
                return console.log(
                    `saga of type ${this.sagaType.name}:${sagaId} has already completed.`,
                );
            }

            const steps = saga.definition.steps.sort((s: any) => s.position);

            if (this.isSagaFail(saga, message)) {
                await this.publishCompensatingCommands(
                    steps,
                    saga.definition.currentStepIndex,
                    tx,
                );

                await this.dataStore.delete(sagasTable, sagaId, { tx });

                return console.log(
                    `saga of type ${this.sagaType.name}:${sagaId} has ended with failure.`,
                );
            }

            if (this.isSagaComplete(saga, message)) {
                await this.dataStore.delete(sagasTable, sagaId, { tx });

                return console.log(
                    `saga ${this.sagaType.name}:${sagaId} has successfully complete.`,
                );
            }

            const currentStep = steps[saga.definition.currentStepIndex];

            if (currentStep.andExpectEvent === message.type) {
                saga.definition.currentStepIndex += 1;

                const nextStep = steps[saga.definition.currentStepIndex];

                console.log(
                    `saga ${this.sagaType.name}:${sagaId} is moving onto step ${nextStep.name}.`,
                );

                if (!nextStep.publishCommand) {
                    throw new InvalidSagaStepDefinitionError(
                        this.sagaType,
                        saga.definition.currentStepIndex,
                    );
                }

                console.log(
                    `saga ${this.sagaType.name}:${sagaId} publishing command ${nextStep.publishCommand.type}.`,
                );

                await this.outboxStore.publishMessage(
                    'command',
                    nextStep.publishCommand.type,
                    nextStep.publishCommand.data,
                    { tx },
                );

                await this.dataStore.store(sagasTable, saga, { tx });
            }
        });
    }

    private isSagaFail = (
        saga: InferSelectModel<typeof sagasTable>,
        message: BusMessage,
    ) => {
        return saga.definition.failOnEvents?.includes(message.type);
    };

    private isSagaComplete = (
        saga: InferSelectModel<typeof sagasTable>,
        message: BusMessage,
    ) => {
        const steps = saga.definition.steps.sort((s: any) => s.position);
        const totalSteps = steps.length;
        const currentStep = steps[saga.definition.currentStepIndex];

        return (
            totalSteps - 1 === saga.definition.currentStepIndex &&
            currentStep.andExpectEvent === message.type
        );
    };

    private async publishCompensatingCommands(
        steps: SagaStepDefinition[],
        failedAtStepIndex: number,
        tx: PgTransaction<any, any, any>,
    ): Promise<void> {
        for (const step of steps) {
            if (step.position === failedAtStepIndex) break;

            const compensateCommand = step.withCompensationCommand;

            if (compensateCommand) {
                console.log(
                    `sending compensation command for step ${step.name}.`,
                );

                await this.outboxStore.publishMessage(
                    'command',
                    compensateCommand.type,
                    compensateCommand.data,
                    { tx },
                );
            }
        }
    }
}

export class SagaBuilder {
    public definition: SagaDefinition = { steps: [], currentStepIndex: 0 };

    step(name: string): SagaStepBuilder {
        return new SagaStepBuilder(name, this.definition);
    }

    failOnEvents(events: Type<Event>[]) {
        this.definition.failOnEvents = events.map((m) => m.name);
    }

    failOnTimeout(date: Date) {
        this.definition.failOnTimeout = date;
    }
}

class SagaStepBuilder {
    constructor(
        private stepName: string,
        private definition: SagaDefinition,
    ) {
        this.definition.steps.push({
            position: this.definition.steps.length,
            name: stepName,
        });
    }

    thenPublishCommand(command: Command): this {
        this.definition.steps[this.definition.steps.length - 1].publishCommand =
            {
                type: command.constructor.name,
                data: command,
            };

        return this;
    }

    withCompensationCommand(command: Command): this {
        this.definition.steps[
            this.definition.steps.length - 1
        ].withCompensationCommand = {
            type: command.constructor.name,
            data: command,
        };
        return this;
    }

    andExpectEvent(event: Type<Event>): this {
        this.definition.steps[this.definition.steps.length - 1].andExpectEvent =
            event.name;
        return this;
    }
}
