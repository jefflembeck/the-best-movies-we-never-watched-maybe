import { IRanker } from "./iranker";

const TOTAL_MOVIES_LISTED_BY_NYT = 100;
export class NYTRanker implements IRanker {
  public multiplier = 0.5;
  rawToScore (val: string | number | undefined): number {
    let value: number;
    if (typeof val === "string") {
      if (val === "N/A") {
        value = TOTAL_MOVIES_LISTED_BY_NYT;
      } else {
        value = parseFloat(val);
      }
    } else if (typeof val === "undefined") {
      value = TOTAL_MOVIES_LISTED_BY_NYT;
    } else {
      value = val;
    }

    return ((value - 1) / (TOTAL_MOVIES_LISTED_BY_NYT - 1));
  }
}
