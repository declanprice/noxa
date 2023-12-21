import { HandleQuery, QueryHandler } from '../../../lib';
import { shipmentsTable } from '../../schema';
import { GetShipmentByIdQuery } from '../api/queries/get-shipment-by-id.query';

@QueryHandler(GetShipmentByIdQuery)
export class GetShipmentByIdHandler extends HandleQuery {
    async handle(query: GetShipmentByIdQuery) {
        return this.dataStore.get(shipmentsTable, query.id);
    }
}
