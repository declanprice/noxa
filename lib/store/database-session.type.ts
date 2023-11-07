import { DataStore } from './data';
import { EventStore } from './event';
import { OutboxStore } from './outbox';

export type DatabaseSession = {
    data: DataStore;
    event: EventStore;
    outbox: OutboxStore;
};
