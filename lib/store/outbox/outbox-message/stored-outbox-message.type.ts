export type StoredOutboxMessage = {
  id: string;
  toBus: string;
  timestamp: string;
  type: string;
  data: object;
};
