import { Inject } from '@nestjs/common';

export const NOXA_CONFIG_TOKEN = 'NOXA_CONFIG_TOKEN';

export const InjectNoxaConfig = () => Inject(NOXA_CONFIG_TOKEN);
