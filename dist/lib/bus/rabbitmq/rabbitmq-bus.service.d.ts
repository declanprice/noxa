import { Type } from '@nestjs/common';
import { BusImplementation } from '../bus-implementation.type';
import { Command, HandleCommand, HandleEvent, Process, Saga } from '../../handlers';
export declare class RabbitmqBus implements BusImplementation {
    private logger;
    constructor(connectionUrl: string);
    sendCommand(command: Command): Promise<void>;
    registerCommandHandlers(handlers: HandleCommand<Command>[]): Promise<void>;
    sendEvent(event: Event): Promise<void>;
    registerEventHandlers(handlers: HandleEvent<Event>[]): Promise<void>;
    registerSagas(sagas: Type<Saga>[]): Promise<void>;
    registerProcesses(processes: Type<Process>[]): Promise<void>;
}
