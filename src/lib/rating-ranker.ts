import { IRanker } from "./iranker";

const DEFAULT = 3.5; // some movies don't have rating information, they're normally quite old and we can just let it be
export class RatingRanker implements IRanker {
  public multiplier = 2.5;
  rawToScore (val: string | undefined): number {
    if (!val) {
      return DEFAULT;
    }
    const score = ratingScoreBases[val]
    return score || DEFAULT;
  }
}

const ratingScoreBases: Record<string, number> = {
  "G": 0,
  "PG":	1,
  "PG-13":	2,
  "Approved":	2.5,
  "Not Rated":	3,
  "Passed":	3.5,
  "R": 4,
  "TV-MA": 5.5,
  "NC-17": 7,
}
