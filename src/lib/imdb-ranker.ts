import { IRanker } from "./iranker";

const TOTAL_MOVIES_LISTED = 250;
export class IMDBRanker implements IRanker {
  public multiplier = 0.2;
  rawToScore (rank: number | undefined): number {
    if (!rank) {
      rank = 250;
    }
    return (rank - 1) / (TOTAL_MOVIES_LISTED - 1);
  }
}
