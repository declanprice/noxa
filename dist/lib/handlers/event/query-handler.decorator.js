"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryHandler = void 0;
const uuid_1 = require("uuid");
const constants_1 = require("../constants");
const QueryHandler = (query) => {
    return (target) => {
        if (!Reflect.hasOwnMetadata(constants_1.QUERY_METADATA, query)) {
            Reflect.defineMetadata(constants_1.QUERY_METADATA, { id: (0, uuid_1.v4)() }, query);
        }
        Reflect.defineMetadata(constants_1.QUERY_HANDLER_METADATA, query, target);
    };
};
exports.QueryHandler = QueryHandler;
