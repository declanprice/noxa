export type StoredStream = {
  id: string;
  type: string;
  version: number;
  snapshot: object | null;
  snapshotVersion: number | null;
  created: string;
  timestamp: string;
  isArchived: boolean;
};
