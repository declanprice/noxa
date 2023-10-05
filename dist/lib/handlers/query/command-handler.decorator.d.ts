import { Command } from './query.type';
export declare const CommandHandler: (command: Command | (new (...args: any[]) => Command)) => ClassDecorator;
