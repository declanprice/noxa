import { Inject } from '@nestjs/common';

export const STORE_CONNECTION_POOL = 'STORE_CONNECTION_POOL';

export const InjectStoreConnectionPool = () => Inject(STORE_CONNECTION_POOL);
