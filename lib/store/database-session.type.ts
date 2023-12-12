import { DataStore } from './data';
import { EventStore } from './event';
import { OutboxStore } from './outbox';

export type DatabaseSession = {
    dataStore: DataStore;
    eventStore: EventStore;
    outboxStore: OutboxStore;
};
