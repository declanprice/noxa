export type BusMessageType = 'command' | 'event';
export type BusMessage = {
    bus: BusMessageType;
    fromContext: string;
    tenantId: string;
    timestamp: string;
    type: string;
    data: object;
};
