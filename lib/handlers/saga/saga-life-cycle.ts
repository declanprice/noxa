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
import { Session } from '../../store/store-session/store-session.service';

export type SagaDefinition = {
  steps: {
    [name: string]: {
      publishCommand?: {
        type: string;
        data: any;
      };
      withCompensationCommand?: {
        type: string;
        data: any;
      };
      toContext?: string;
      andExpectEvent?: string;
    };
  };
  failOnEvents?: string[];
  failOnTimeout?: Date;
  completeOnStep?: number;
};

export abstract class SagaLifeCycle {
  private sagaType = this.constructor as Type;

  constructor(
    @Inject(StoreSession) private readonly storeSession: StoreSession,
  ) {}

  async handle(message: BusMessage): Promise<void> {
    const startEvent = getSagaStartEvent(this.sagaType);
    const startHandler = getSagaStartHandler(this.sagaType);

    const session = await this.storeSession.start();

    try {
      const sagaId = startEvent.associationId(message.data);

      if (startEvent.event.name === message.type) {
        console.log(`start new saga instance ${this.sagaType.name}:${sagaId}.`);

        const builder: SagaBuilder = (this as any)[startHandler](message.data);

        if (!builder) {
          throw new InvalidSagaDefinitionError(this.sagaType);
        }

        await session.document.store(this.sagaType, sagaId, {
          definition: builder.definition,
          currentStepIndex: 0,
        });
      }

      const storedSaga: StoredSaga = await session.document.find(
        this.sagaType,
        sagaId,
      );

      if (!storedSaga) {
        console.log(
          `saga of type ${this.sagaType.name}:${sagaId} has already completed.`,
        );

        return await session.commit();
      }

      const stepNames = Object.keys(storedSaga.definition.steps);

      const currentStepName = stepNames[storedSaga.currentStepIndex];
      const currentStep = storedSaga.definition.steps[currentStepName];

      if (this.isSagaFail(storedSaga.definition, message)) {
        await this.publishCompensatingCommands(
          storedSaga.definition,
          currentStepName,
          session,
        );
        await session.document.delete(this.sagaType, sagaId);
        await session.commit();
        console.log(
          `saga of type ${this.sagaType.name}:${sagaId} has ended with failure.`,
        );
        return;
      }

      if (currentStep.andExpectEvent === message.type) {
        storedSaga.currentStepIndex += 1;
        console.log(
          `saga ${this.sagaType.name}:${sagaId} is moving onto step ${storedSaga.currentStepIndex}.`,
        );
      }

      if (!currentStep.publishCommand) {
        throw new InvalidSagaStepDefinitionError(
          this.sagaType,
          storedSaga.currentStepIndex,
        );
      }

      console.log(
        `saga ${this.sagaType.name}:${sagaId} publishing command ${currentStep.publishCommand.type}.`,
      );

      await session.outbox.publishMessage(
        'command',
        currentStep.publishCommand.type,
        currentStep.publishCommand.data,
      );

      if (storedSaga.currentStepIndex !== stepNames.length) {
        await session.document.store(this.sagaType, sagaId, storedSaga);
      } else {
        console.log(
          `saga ${this.sagaType.name}:${sagaId} has successfully complete.`,
        );
        await session.document.delete(this.sagaType, sagaId);
      }

      await session.commit();
    } catch (error) {
      console.log(error);
      await session.rollback();
      throw error;
    } finally {
      session.release();
    }
  }

  private isSagaFail = (definition: SagaDefinition, message: BusMessage) => {
    return definition.failOnEvents?.includes(message.type);
  };

  private async publishCompensatingCommands(
    definition: SagaDefinition,
    failedAtStepName: string,
    session: Session,
  ): Promise<void> {
    for (const stepName in definition.steps) {
      if (failedAtStepName === stepName) break;

      console.log(`sending compensation command for step ${stepName}.`);

      const compensateCommand =
        definition.steps[stepName].withCompensationCommand;

      if (compensateCommand) {
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
  public definition: SagaDefinition = { steps: {} };

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
    this.definition.steps[stepName] = {};
  }

  thenPublishCommand(command: Command): this {
    this.definition.steps[this.stepName].publishCommand = {
      type: command.constructor.name,
      data: command,
    };

    return this;
  }

  toContext(context: string): this {
    this.definition.steps[this.stepName].toContext = context;
    return this;
  }

  withCompensationCommand(command: Command): this {
    this.definition.steps[this.stepName].withCompensationCommand = {
      type: command.constructor.name,
      data: command,
    };
    return this;
  }

  andExpectEvent(event: Type<Event>): this {
    this.definition.steps[this.stepName].andExpectEvent = event.name;
    return this;
  }
}

export type StoredSaga = {
  definition: SagaDefinition;
  currentStepIndex: number;
};
