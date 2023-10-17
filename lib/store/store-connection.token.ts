import { Inject } from '@nestjs/common';

export const STORE_CONNECTION_TOKEN = 'STORE_CONNECTION';

export const InjectStoreConnection = () => Inject(STORE_CONNECTION_TOKEN);
