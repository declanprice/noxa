import { DataStore, EventStore, OutboxStore } from '../../store';

export class ProcessSession<Data> {
    public id: string;
    public data: Data = {} as Data;
    public hasEnded: boolean = false;
    public associations: string[] = [];

    constructor(
        process: {
            id: string;
            data: unknown;
            hasEnded: boolean;
            associations: string[];
        },
        public readonly dataStore: DataStore,
        public readonly eventStore: EventStore,
        public readonly outboxStore: OutboxStore,
    ) {
        this.id = process.id;
        this.data = process.data as Data;
        this.hasEnded = process.hasEnded;
        this.associations = process.associations;
    }

    associateWith(id: string): void {
        const indexOf = this.associations.indexOf(id);

        if (indexOf === -1) {
            this.associations.push(id);
        }
    }

    removeAssociation(id: string): void {
        const indexOf = this.associations.indexOf(id);

        if (indexOf !== -1) {
            this.associations.splice(indexOf, 1);
        }
    }

    end(): void {
        this.hasEnded = true;
    }

    update(data: Partial<Data>) {
        Object.assign(this, {
            data,
        });
    }
}
