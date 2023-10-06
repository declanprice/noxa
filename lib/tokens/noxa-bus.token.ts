import { Inject } from '@nestjs/common';

export const NOXA_BUS_TOKEN = 'NOXA_BUS_TOKEN';

export const InjectNoxaBus = () => Inject(NOXA_BUS_TOKEN);
