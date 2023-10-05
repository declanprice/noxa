import { Command } from './command.type';
export declare const CommandHandler: (command: Command | (new (...args: any[]) => Command)) => ClassDecorator;
