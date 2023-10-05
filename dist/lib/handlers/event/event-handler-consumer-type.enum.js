"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventConsumerType = void 0;
var EventConsumerType;
(function (EventConsumerType) {
    EventConsumerType[EventConsumerType["PUB_SUB"] = 0] = "PUB_SUB";
    EventConsumerType[EventConsumerType["FIFO"] = 1] = "FIFO";
    EventConsumerType[EventConsumerType["STANDARD"] = 2] = "STANDARD";
})(EventConsumerType || (exports.EventConsumerType = EventConsumerType = {}));
