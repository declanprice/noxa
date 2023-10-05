export type BusMessage = {
    fromContext: string;
    tenantId: string;
    timestamp: string;
    type: string;
    data: object;
};
