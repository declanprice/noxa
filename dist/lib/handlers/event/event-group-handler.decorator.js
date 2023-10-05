"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventGroupHandler = void 0;
const uuid_1 = require("uuid");
const constants_1 = require("../constants");
const EventGroupHandler = (options) => {
    return (target) => {
        if (!Reflect.hasOwnMetadata(constants_1.EVENT_METADATA, event)) {
            Reflect.defineMetadata(constants_1.EVENT_METADATA, { id: (0, uuid_1.v4)() }, event);
        }
        Reflect.defineMetadata(constants_1.EVENT_HANDLER_METADATA, event, target);
    };
};
exports.EventGroupHandler = EventGroupHandler;
