import { IRanker } from "./iranker";

/**
 * new movies have faster pacing, easier to take on
 */
export class DecadeRanker implements IRanker {
  public multiplier = 1.2;
  rawToScore (year: string | undefined) {
    if (!year) {
      return 4;
    }

    const num = parseInt(year);
    if (Number.isNaN(num)) {
      return 4;
    }


    if (num > 2009) {
      return 0;
    }

    if (num > 1999) {
      return .5;
    }

    if (num > 1989) {
      return 1;
    }

    if (num > 1979) {
      return 1.5;
    }

    if (num > 1969) {
      return 2;
    }

    if (num > 1959) {
      return 2.5;
    }

    if (num > 1949) {
      return 3;
    }

    if (num > 1939) {
      return 3.5;
    }

    return 4;
    };
}
