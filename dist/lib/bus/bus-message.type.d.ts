export type BusMessageType = 'command' | 'event';
export type BusMessage = {
    bus: BusMessageType;
    fromContext: string;
    targetContext: string;
    tenantId: string;
    timestamp: string;
    type: string;
    data: object;
};
