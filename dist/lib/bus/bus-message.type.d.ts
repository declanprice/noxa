export type BusMessageType = 'command' | 'event';
export type BusMessage = {
    bus: BusMessageType;
    fromContext: string;
    targetContext: string | null;
    tenantId: string;
    timestamp: string;
    type: string;
    data: object;
};
