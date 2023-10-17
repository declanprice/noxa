export type BusMessage = {
    fromContext: string;
    toContext: string | null;
    tenantId: string;
    timestamp: string;
    type: string;
    data: object;
};
