import { DatabaseTransactionClient } from '../../store/database-client.service';
import { EventMessage } from '../event';

export type ProcessState<Data> = {
    id: string;
    data: Data;
    hasEnded: boolean;
    associations: string[];
};

export class ProcessSession<Event, Data> {
    public data: Data = {} as Data;

    constructor(
        public event: EventMessage<Event>,
        private state: ProcessState<Data>,
        public tx: DatabaseTransactionClient,
    ) {
        this.data = state.data as Data;
    }

    associateWith(id: string): void {
        const indexOf = this.state.associations.indexOf(id);

        if (indexOf === -1) {
            this.state.associations.push(id);
        }
    }

    removeAssociation(id: string): void {
        const indexOf = this.state.associations.indexOf(id);

        if (indexOf !== -1) {
            this.state.associations.splice(indexOf, 1);
        }
    }

    end(): void {
        this.state.hasEnded = true;
    }

    get id() {
        return this.state.id;
    }

    get hasEnded() {
        return this.state.hasEnded;
    }

    get associations() {
        return this.state.associations;
    }
}
