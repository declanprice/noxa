export type StoredEvent = {
  sequenceId: number;
  id: string;
  eventStreamId: string;
  version: number;
  data: any;
  type: string;
  timestamp: string;
  tenantId: string;
  isArchived: boolean;
};
