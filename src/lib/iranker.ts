export interface IRanker {
  multiplier: number;
  rawToScore: (val: any) => number;
}
