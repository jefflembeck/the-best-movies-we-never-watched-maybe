import { IRanker } from "./iranker";

export class LengthRanker implements IRanker {
  public multiplier = 1;
  rawToScore (length: string | undefined) {
    if (!length) {
      return 2;
    }

    const mins = parseTimeToMinutes(length);
    if (mins <= 90) {
      return 0;
    }

    if (mins > 90 && mins <= 120) {
      return .5;
    }

    if (mins > 120 && mins <= 150) {
      return 1;
    }

    if (mins > 150 && mins <= 180) {
      return 1.5;
    }

    return 2;
  };
}

/**
 * Parses a time string in the format "1h 30m", "1h", or "30m"
 * and returns the total number of minutes.
 * If the parsed result is 0, returns 1000 instead.
 */
function parseTimeToMinutes(input: string): number {
    const hourMatch = input.match(/(\d+)\s*h/);
    const minuteMatch = input.match(/(\d+)\s*m/);

    const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;

    const total = hours * 60 + minutes;
    return total === 0 ? 1000 : total;
}

/**
| Length       | Score |
| ------------ | ----- |
| ≤ 90 mins    | 0     |
| 91–120 mins  | 0.5   |
| 121–150 mins | 1     |
| 151–180 mins | 1.5   |
| >180 mins    | 2     |
*/
