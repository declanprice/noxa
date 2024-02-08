import { Type } from '@nestjs/common';

export const QUERY_HANDLER_TYPE = 'QUERY_HANDLER_METADATA';

export const QueryHandler = (type: Type): ClassDecorator => {
    return (target: object) => {
        Reflect.defineMetadata(QUERY_HANDLER_TYPE, type.name, target);
    };
};

export const getQueryHandlerType = (target: any): string => {
    return Reflect.getMetadata(QUERY_HANDLER_TYPE, target);
};
