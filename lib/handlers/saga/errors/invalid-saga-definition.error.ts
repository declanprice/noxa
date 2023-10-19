import { Type } from '@nestjs/common';

export class InvalidSagaDefinitionError extends Error {
  constructor(sagaType: Type) {
    super(`saga of type ${sagaType.name} has an invalid saga definition.`);
  }
}

export class InvalidSagaStepDefinitionError extends Error {
  constructor(sagaType: Type, step: number) {
    super(
      `saga of type ${sagaType.name} has an invalid saga definition at step ${step}, ensure publishCommand and expectEvent is present.`,
    );
  }
}
