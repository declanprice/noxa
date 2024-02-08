import { Type } from '@nestjs/common';

export const COMMAND_HANDLER_TYPE = 'COMMAND_HANDLER_TYPE';

export const CommandHandler = (type: Type): ClassDecorator => {
    return (target: object) => {
        Reflect.defineMetadata(COMMAND_HANDLER_TYPE, type.name, target);
    };
};

export const getCommandHandlerType = (target: any) => {
    return Reflect.getMetadata(COMMAND_HANDLER_TYPE, target);
};
