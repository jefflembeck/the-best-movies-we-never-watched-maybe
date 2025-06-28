"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NYTRanker = void 0;
const TOTAL_MOVIES_LISTED_BY_NYT = 100;
class NYTRanker {
    multiplier = 0.5;
    rawToScore(val) {
        let value;
        if (typeof val === "string") {
            if (val === "N/A") {
                value = TOTAL_MOVIES_LISTED_BY_NYT;
            }
            else {
                value = parseFloat(val);
            }
        }
        else if (typeof val === "undefined") {
            value = TOTAL_MOVIES_LISTED_BY_NYT;
        }
        else {
            value = val;
        }
        return ((value - 1) / (TOTAL_MOVIES_LISTED_BY_NYT - 1));
    }
}
exports.NYTRanker = NYTRanker;
