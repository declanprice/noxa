import { Inject, Type } from '@nestjs/common';

export type Config = {
  context: string;
  documents?: Type[];
  asyncDaemon: {
    enabled: boolean;
  };
};

export const CONFIG_TOKEN = 'CONFIG_TOKEN';

export const InjectConfig = () => Inject(CONFIG_TOKEN);
