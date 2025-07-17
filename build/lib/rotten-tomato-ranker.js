"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RottenTomatoesRanker = void 0;
class RottenTomatoesRanker {
    multiplier = 0.3;
    rawToScore(val = "0%") {
        let pct = parseFloat(val) / 100;
        if (Number.isNaN(pct)) {
            pct - 0;
        }
        return 1 - pct;
    }
}
exports.RottenTomatoesRanker = RottenTomatoesRanker;
