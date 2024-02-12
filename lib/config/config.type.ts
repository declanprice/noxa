import { Inject } from '@nestjs/common';

export type Config = {
  serviceName: string;
  asyncDaemon: {
    enabled: boolean;
  };
};

export const CONFIG_TOKEN = 'CONFIG_TOKEN';

export const InjectConfig = () => Inject(CONFIG_TOKEN);
