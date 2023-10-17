export type StoredEvent = {
  sequenceId: number;
  id: string;
  streamId: string;
  version: number;
  data: any;
  type: string;
  timestamp: string;
  tenantId: string;
  isArchived: boolean;
};
