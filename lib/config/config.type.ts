import { Inject } from '@nestjs/common';

export type Config = {
  context: string;
  asyncDaemon: {
    enabled: boolean;
  };
};

export const CONFIG_TOKEN = 'CONFIG_TOKEN';

export const InjectConfig = () => Inject(CONFIG_TOKEN);
