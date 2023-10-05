import { CommandBus } from '../lib';
export declare class AppController {
    commandBus: CommandBus;
    constructor(commandBus: CommandBus);
    get(): Promise<void>;
}
