import { Document, DocumentId, DocumentField } from '../../store';
import { SagaDefinition } from './handle-saga';

@Document()
export class SagaDocument {
    @DocumentId()
    sagaId: string;

    @DocumentField()
    definition: SagaDefinition;

    @DocumentField()
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
