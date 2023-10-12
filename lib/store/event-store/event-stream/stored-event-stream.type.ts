export type StoredEventStream = {
  id: string;
  type: string;
  version: number;
  snapshot: object | null;
  snapshotVersion: number | null;
  created: string;
  timestamp: string;
  tenantId: string;
  isArchived: boolean;
};
