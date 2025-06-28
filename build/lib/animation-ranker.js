"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimationRanker = void 0;
class AnimationRanker {
    multiplier = 1;
    rawToScore(val) {
        return val ? -1 : 0;
    }
}
exports.AnimationRanker = AnimationRanker;
