import { SagaDefinition } from './handle-saga';

export class SagaData {
    sagaId: string;
    definition: SagaDefinition;
    currentStepIndex: number;

    constructor(data: {
        sagaId: string;
        definition: SagaDefinition;
        currentStepIndex: number;
    }) {
        this.sagaId = data.sagaId;
        this.definition = data.definition;
        this.currentStepIndex = data.currentStepIndex;
    }
}
