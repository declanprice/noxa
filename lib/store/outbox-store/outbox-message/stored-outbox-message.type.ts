export type StoredOutboxMessage = {
  id: string;
  toBus: string;
  fromContext: string;
  toContext: string | null;
  tenantId: string;
  timestamp: string;
  type: string;
  data: object;
};
