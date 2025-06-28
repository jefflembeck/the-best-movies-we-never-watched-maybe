import { IRanker } from "./iranker";

export class RottenTomatoesRanker implements IRanker {
  public multiplier = 0.3;
  rawToScore(val: string = "0%"): number {
    let pct = parseFloat(val) / 100;
    if (Number.isNaN(pct)) {
      pct - 0;
    }
    return 1 - pct;
  }
}
