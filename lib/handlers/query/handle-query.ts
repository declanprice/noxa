import { Query } from './query.type';
import { Inject } from '@nestjs/common';
import { DataStore } from '../../store';

export abstract class HandleQuery {
    constructor(@Inject(DataStore) public readonly dataStore: DataStore) {}

    abstract handle(query: Query): Promise<any>;
}
