import { DatabaseTransactionClient } from '../../store/database-client.service';
import { EventMessage } from '../event';

export type ProjectionSession<Event> = {
    tx: DatabaseTransactionClient;
    event: EventMessage<Event>;
};
