"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMDBRanker = void 0;
const TOTAL_MOVIES_LISTED = 250;
class IMDBRanker {
    multiplier = 0.2;
    rawToScore(rank) {
        if (!rank) {
            rank = 250;
        }
        return (rank - 1) / (TOTAL_MOVIES_LISTED - 1);
    }
}
exports.IMDBRanker = IMDBRanker;
