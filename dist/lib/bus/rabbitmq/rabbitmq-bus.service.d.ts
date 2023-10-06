import { BusImplementation } from '../bus-implementation.type';
import { Command, HandleCommand, HandleEvent } from '../../handlers';
import { BusMessage } from '../bus-message.type';
export type RabbitmqBusOptions = {
    connectionUrl: string;
    autoCreateResources?: boolean;
};
export declare class RabbitmqBus implements BusImplementation {
    private readonly options;
    private logger;
    private channel?;
    constructor(options: RabbitmqBusOptions);
    connect(connectionUrl: string): Promise<void>;
    sendCommand(message: BusMessage): Promise<void>;
    registerCommandHandler(handler: HandleCommand<Command>): Promise<void>;
    sendEvent(event: BusMessage): Promise<void>;
    registerEventHandler(handler: HandleEvent<Event>): Promise<void>;
}
