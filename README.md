# Top250MoviesIMDB — Composite Ranking with RT & NYT

This project combines three sources of movie rankings—IMDb popularity, Rotten Tomatoes critics’ scores, and The New York Times editorial list—to produce a single **early-watch** score. Lower scores indicate a movie should be watched sooner.

## Data Files

- **movies-with-rt.json**  
  Original list of top-250 IMDb movies, augmented with Rotten Tomatoes % (`rottenTomatoes`).
- **nytimesmoviedata.json**  
  Editorial top-100 list from The New York Times, with `"number"` and `"title"`.
- **movies-with-rt-with-nyt.json**  
  Output from `add-nyt-ranking.js`: every movie now has:
  - `nytRank`: string rank `"1"`–`"100"` or `"N/A"`
  - `inNyt`: boolean flag if it made the NYT top-100

- **movies-ranked.json**  
  Final output from `rank-movies.js`: each movie also has `earlyScore` computed.

## Scripts

All scripts live under `scripts/`:

1. **add-nyt-ranking.js**  
   - Normalizes titles (lowercase, no punctuation/spaces), builds lookup from NYT list.
   - Adds two fields on every movie:
     - `inNyt` (boolean)
     - `nytRank` (`"1"`–`"100"` or `"N/A"`)

2. **rank-movies.js**  
   - Reads `movies-with-rt-with-nyt.json`
   - Normalizes each metric to a 0…1 range (0 = best)
   - Applies weights to compute `earlyScore`
   - Sorts ascending and writes `movies-ranked.json`

## Normalization Formulas

Let:
- **N** = total number of movies (e.g. 250)  
- **M** = 100 (NYT top-100 scale)

```js
// IMDb: rank 1…N → norm 0…1 (0 best)
imdbNorm = (imdbRank - 1) / (N - 1)

// Rotten Tomatoes: "0%"… "100%" → norm 1…0 (0 best)
rtNorm   = 1 - ( parseFloat(rottenTomatoes) / 100 )

// NYT rank: "1"… "100" → norm 0…1 (0 best); "N/A" → treated as 100
nytRaw   = (nytRank === "N/A" ? M : parseInt(nytRank,10))
nytNorm  = (nytRaw - 1) / (M - 1)
```

## Weights

You trust **editorial** most, then **critical**, then **popularity**, so we assign:

- **wNYT**   = 0.50  
- **wRT**    = 0.30  
- **wIMDb**  = 0.20  

Additionally, each movie carries its existing `totalScore` (from your original RT+IMDb blend).

## Total Score Components

Each movie’s `totalScore` is computed by summing the following attributes:

- `ratingScore`  
- `blackAndWhite`  
- `decadeScore`  
- `lengthScore`  
- `animationScore`  

```js
totalScore = ratingScore + blackAndWhite + decadeScore + lengthScore + animationScore
```

## Full Score Composition

In `src/index.ts`, the scoring function returns the sum of all components:

```ts
return imdbScore +
  decadeScore +
  lengthScore +
  ratingScore +
  blackAndWhiteScore +
  animatedScore +
  rtScore +
  nytScore;
```

## Component Scoring & Multipliers

Below is a breakdown of how each `totalScore` component is calculated and its multiplier:

- **ratingScore**  
  - raw: based on MPAA rating mapping  
  - values:  
    - `"G" → 0`  
    - `"PG" → 1`  
    - `"PG-13" → 2`  
    - `"Approved" → 2.5`  
    - `"Not Rated" → 3`  
    - `"Passed" → 3.5`  
    - `"R" → 4`  
    - `"TV-MA" → 5.5`  
    - `"NC-17" → 7`  
  - multiplier: **2.5**

- **blackAndWhite**  
  - raw: `1` if the movie is black and white, else `0`  
  - multiplier: **1**

- **decadeScore**  
  - raw: based on release year  
    - post-2009: 0  
    - 2000–2009: 0.5  
    - 1990–1999: 1  
    - 1980–1989: 1.5  
    - 1970–1979: 2  
    - 1960–1969: 2.5  
    - 1950–1959: 3  
    - 1940–1949: 3.5  
    - pre-1940: 4  
  - multiplier: **1.2**

- **lengthScore**  
  - raw: based on runtime  
    - ≤90 mins: 0  
    - 91–120 mins: 0.5  
    - 121–150 mins: 1  
    - 151–180 mins: 1.5  
    - >180 mins: 2  
  - multiplier: **1**

- **animationScore**  
  - raw: `-1` if animated, else `0`  
  - multiplier: **1**

- **rtScore**  
  - raw: `1 - ( parseFloat(rottenTomatoes) / 100 )`  
  - multiplier: **0.3**

- **nytScore**  
  - raw: `(nytRaw - 1) / (M - 1)`  
  - multiplier: **0.5**

```js
totalScore = ratingScore
           + blackAndWhite
           + decadeScore
           + lengthScore
           + animationScore
```

## Final Score Calculation

For each movie:

```js
earlyScore =
  totalScore
  + (nytNorm  * wNYT)   // editorial penalty/bonus
  + (rtNorm   * wRT)    // critic consensus penalty
  + (imdbNorm * wIMDb)  // popularity penalty
```

- **Lower** `earlyScore` → **watch earlier**.
- Sorted ascending yields your prioritized watch list.

## Usage

1. Install dependencies (Node.js ≥ 12).
2. From project root:
   ```bash
   node scripts/add-nyt-ranking.js
   node scripts/rank-movies.js
   ```
3. Inspect:
   - `movies-with-rt-with-nyt.json`  
   - `movies-ranked.json` (contains `earlyScore` and sorted order)

## Tuning

- Adjust `wNYT`, `wRT`, or `wIMDb` in `scripts/rank-movies.js` to reflect changing preferences.
- Re-run scripts to regenerate rankings.

---
Enjoy your perfectly weighted watch list!