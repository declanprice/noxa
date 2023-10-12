export type StoredOutboxMessage = {
  toBus: string;
  fromContext: string;
  toContext: string | null;
  tenantId: string;
  timestamp: string;
  type: string;
  data: object;
};
