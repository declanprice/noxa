import { Inject, Type } from '@nestjs/common';
import { Command } from '../command/command.type';
import { Event } from '../event/event.type';
import { StoreSession } from '../../store';
import { BusMessage } from '../../bus';
import { getSagaStartEvent, getSagaStartHandler } from './saga.decorators';
import {
    InvalidSagaDefinitionError,
    InvalidSagaStepDefinitionError,
} from './errors/invalid-saga-definition.error';
import { Session } from '../../store/session/store-session.service';
import { SagaDocument } from './saga.document';

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
};

export abstract class HandleSaga {
    private sagaType = this.constructor as Type;

    constructor(
        @Inject(StoreSession) private readonly storeSession: StoreSession,
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

        const session = await this.storeSession.start();

        try {
            const sagaId = startEvent.associationId(message.data);

            if (startEvent.event.name === message.type) {
                await session.document.store(
                    new SagaDocument({
                        sagaId,
                        definition: builder.definition,
                        currentStepIndex: 0,
                    }),
                );

                const firstStep = builder.definition.steps.sort(
                    (s) => s.position,
                )[0];

                if (firstStep.publishCommand) {
                    await session.outbox.publishMessage(
                        'command',
                        firstStep.publishCommand.type,
                        firstStep.publishCommand.data,
                    );
                }

                await session.commit();

                console.log(
                    `started new saga instance ${this.sagaType.name}:${sagaId}.`,
                );

                return;
            }

            const sagaDocument = await session.document.find(
                SagaDocument,
                sagaId,
            );

            if (!sagaDocument) {
                console.log(
                    `saga of type ${this.sagaType.name}:${sagaId} has already completed.`,
                );
                return await session.commit();
            }

            const steps = sagaDocument.definition.steps.sort((s) => s.position);

            if (this.isSagaFail(sagaDocument, message)) {
                await this.publishCompensatingCommands(
                    steps,
                    sagaDocument.currentStepIndex,
                    session,
                );
                await session.document.delete(SagaDocument, sagaId);
                await session.commit();
                console.log(
                    `saga of type ${this.sagaType.name}:${sagaId} has ended with failure.`,
                );
                return;
            }

            if (this.isSagaComplete(sagaDocument, message)) {
                console.log(
                    `saga ${this.sagaType.name}:${sagaId} has successfully complete.`,
                );
                await session.document.delete(SagaDocument, sagaId);
                await session.commit();
                return;
            }

            const currentStep = steps[sagaDocument.currentStepIndex];

            if (currentStep.andExpectEvent === message.type) {
                sagaDocument.currentStepIndex += 1;

                const nextStep = steps[sagaDocument.currentStepIndex];

                console.log(
                    `saga ${this.sagaType.name}:${sagaId} is moving onto step ${nextStep.name}.`,
                );

                if (!nextStep.publishCommand) {
                    throw new InvalidSagaStepDefinitionError(
                        this.sagaType,
                        sagaDocument.currentStepIndex,
                    );
                }

                console.log(
                    `saga ${this.sagaType.name}:${sagaId} publishing command ${nextStep.publishCommand.type}.`,
                );

                await session.outbox.publishMessage(
                    'command',
                    nextStep.publishCommand.type,
                    nextStep.publishCommand.data,
                );

                await session.document.store(sagaDocument);

                await session.commit();
            }
        } catch (error) {
            console.log(error);
            await session.rollback();
            throw error;
        } finally {
            session.release();
        }
    }

    private isSagaFail = (saga: SagaDocument, message: BusMessage) => {
        return saga.definition.failOnEvents?.includes(message.type);
    };

    private isSagaComplete = (saga: SagaDocument, message: BusMessage) => {
        const steps = saga.definition.steps.sort((s) => s.position);
        const totalSteps = steps.length;
        const currentStep = steps[saga.currentStepIndex];

        return (
            totalSteps - 1 === saga.currentStepIndex &&
            currentStep.andExpectEvent === message.type
        );
    };

    private async publishCompensatingCommands(
        steps: SagaStepDefinition[],
        failedAtStepIndex: number,
        session: Session,
    ): Promise<void> {
        for (const step of steps) {
            if (step.position === failedAtStepIndex) break;

            const compensateCommand = step.withCompensationCommand;

            if (compensateCommand) {
                console.log(
                    `sending compensation command for step ${step.name}.`,
                );

                await session.outbox.publishMessage(
                    'command',
                    compensateCommand.type,
                    compensateCommand.data,
                );
            }
        }
    }
}

export class SagaBuilder {
    public definition: SagaDefinition = { steps: [] };

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
