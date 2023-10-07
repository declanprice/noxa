"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandHandler = void 0;
const constants_1 = require("../constants");
const uuid_1 = require("uuid");
const CommandHandler = (command) => {
    return (target) => {
        if (!Reflect.hasOwnMetadata(constants_1.COMMAND_METADATA, command)) {
            Reflect.defineMetadata(constants_1.COMMAND_METADATA, { id: (0, uuid_1.v4)(), type: command.name }, command);
        }
        Reflect.defineMetadata(constants_1.COMMAND_HANDLER_METADATA, command, target);
    };
};
exports.CommandHandler = CommandHandler;
