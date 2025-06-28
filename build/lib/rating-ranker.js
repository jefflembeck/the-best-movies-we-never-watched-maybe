"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingRanker = void 0;
const DEFAULT = 3.5; // some movies don't have rating information, they're normally quite old and we can just let it be
class RatingRanker {
    multiplier = 2.5;
    rawToScore(val) {
        if (!val) {
            return DEFAULT;
        }
        const score = ratingScoreBases[val];
        return score || DEFAULT;
    }
}
exports.RatingRanker = RatingRanker;
const ratingScoreBases = {
    "G": 0,
    "PG": 1,
    "PG-13": 2,
    "Approved": 2.5,
    "Not Rated": 3,
    "Passed": 3.5,
    "R": 4,
    "TV-MA": 5.5,
    "NC-17": 7,
};
