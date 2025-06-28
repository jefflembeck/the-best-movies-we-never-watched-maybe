import { IRanker } from "./iranker";

export class BlackAndWhiteRanker implements IRanker {
  public multiplier = 1;
  rawToScore (val: boolean | undefined): number {
    return val ? 1: 0;
  }
}
