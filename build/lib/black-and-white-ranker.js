"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlackAndWhiteRanker = void 0;
class BlackAndWhiteRanker {
    multiplier = 1;
    rawToScore(val) {
        return val ? 1 : 0;
    }
}
exports.BlackAndWhiteRanker = BlackAndWhiteRanker;
