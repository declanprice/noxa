"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventHandler = void 0;
const uuid_1 = require("uuid");
const constants_1 = require("../constants");
const EventHandler = (event, options) => {
    return (target) => {
        if (!Reflect.hasOwnMetadata(constants_1.EVENT_METADATA, event)) {
            Reflect.defineMetadata(constants_1.EVENT_METADATA, { id: (0, uuid_1.v4)() }, event);
        }
        Reflect.defineMetadata(constants_1.EVENT_HANDLER_OPTIONS_METADATA, options, target);
        Reflect.defineMetadata(constants_1.EVENT_HANDLER_METADATA, event, target);
    };
};
exports.EventHandler = EventHandler;
