import { BusRelay } from '../bus-relay.type';
import { Command, HandleCommand, HandleEvent } from '../../handlers';
import { BusMessage } from '../bus-message.type';
import { Config } from '../../config';
export type RabbitmqBusOptions = {
    connectionUrl: string;
    autoCreateResources?: boolean;
};
export declare class RabbitmqBus implements BusRelay {
    private readonly options;
    private logger;
    private channel?;
    private config?;
    constructor(options: RabbitmqBusOptions);
    init(config: Config): Promise<void>;
    sendCommand(command: BusMessage): Promise<void>;
    sendEvent(event: BusMessage): Promise<void>;
    registerCommandHandler(handler: HandleCommand<Command>, options: {
        type: string;
    }): Promise<void>;
    registerEventHandler(handler: HandleEvent<Event>, options: {
        type: string;
    }): Promise<void>;
}
