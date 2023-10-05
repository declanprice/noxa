"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.camelize = void 0;
const camelize = (str) => {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
        .replace(/\s+/g, '');
};
exports.camelize = camelize;
