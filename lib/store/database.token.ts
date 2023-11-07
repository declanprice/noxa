import { Inject } from '@nestjs/common';

export const DATABASE_TOKEN = 'DATABASE_TOKEN';

export const InjectDatabase = () => Inject(DATABASE_TOKEN);
