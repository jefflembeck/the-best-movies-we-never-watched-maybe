# CLAUDE.md

## Project Overview

A two-stage family movie ranking system. Stage 1 scores all movies for cultural significance and selects the top 250. Stage 2 orders that pool by how accessible they are for a preteen viewer (age-appropriate rating, runtime, era, color, animation). Lower accessibility score = watch sooner.

## Tech Stack

- **Language:** TypeScript (CommonJS modules)
- **Runtime:** Node.js 22+
- **Build:** `tsc` (TypeScript compiler)
- **Execution:** `ts-node` for direct TypeScript execution
- **Presentation:** reveal.js for slideshow output

## Repository Structure

```
src/
├── index.ts                      # Main entry — both scoring stages, sorting, output
├── types/
│   └── movie.ts                  # Movie type definition
├── lib/
│   ├── iranker.ts                # IRanker interface (multiplier + rawToScore)
│   ├── rating-ranker.ts          # MPAA rating → accessibility score (multiplier 2.5)
│   ├── decade-ranker.ts          # Release year → accessibility score (multiplier 1.2)
│   ├── length-ranker.ts          # Runtime → accessibility score (multiplier 1.0)
│   ├── black-and-white-ranker.ts # B&W flag → accessibility score (multiplier 1.0)
│   ├── animation-ranker.ts       # Animated flag → accessibility score (multiplier 1.0)
│   ├── imdb-ranker.ts            # ORPHANED — not imported by index.ts
│   ├── rotten-tomato-ranker.ts   # ORPHANED — not imported by index.ts
│   └── nyt-ranker.ts             # ORPHANED — not imported by index.ts
├── data/
│   ├── movies.json               # Movie database — single source of truth
│   ├── sight-and-sound.json      # Sight & Sound top films (with rank + imdbId)
│   ├── afi.json                  # AFI top 100 (with rank + imdbId)
│   └── criterion.json            # Criterion Collection titles (imdbId list)
scripts/
├── update-imdb-rankings.js       # Monthly IMDb Top 250 update (downloads IMDb datasets)
├── add-nyt-ranking.js            # Merges NYT rankings into movies.json
└── fetch-rotten.js               # Fetches RT ratings via OMDb API (requires OMDBAPIKEY)
.github/workflows/
└── update-imdb-rankings.yml      # Monthly cron — runs update script and opens a PR
build/                            # Compiled JS output (generated — do not edit)
MOVIES.md                         # Generated ranked movie list (do not edit)
```

## Commands

- `npm run create-list` — Run the full pipeline via `ts-node src/index.ts`. Regenerates `MOVIES.md`.
- `npm run update-imdb` — Download IMDb datasets and update rankings in `movies.json`.
- `npm run build` — Compile TypeScript to JavaScript in `build/`.
- `npm test` — Not implemented (placeholder only).

## Architecture

### IRanker Interface (`src/lib/iranker.ts`)

Used exclusively for Stage 2 (accessibility) rankers:

```typescript
interface IRanker {
  multiplier: number;
  rawToScore: (val: any) => number;
}
```

Score contribution = `rawToScore(value) * multiplier`. Lower = more accessible / watch sooner.

### Stage 1: Quality Scoring

**Location:** `qualityScore()` function in `src/index.ts` — inline logic, NOT using IRanker classes.

Selects the top 250 most culturally significant films. Lower score = more canonical.

| Signal | Weight | Scoring logic |
|---|---|---|
| Sight & Sound rank | 3.0 | `rank / 250` (0.004–1.0); not listed → `1.5 × 3.0` |
| Criterion Collection | 2.5 | listed → `0`; not listed → `1.0 × 2.5` |
| AFI rank | 2.0 | `rank / 100` (0.01–1.0); not listed → `1.5 × 2.0` |
| NYT rank | 2.0 | `rank / 100` (0.01–1.0); not ranked → `1.0 × 2.0` |
| Rotten Tomatoes | 1.5 | `(100 − score) / 100`; unknown → `0.5 × 1.5` |
| IMDb rank | 1.0 | `rank / 500` (0.002–1.0); not ranked → `1.5 × 1.0` |

Canonical list data is loaded from `data/sight-and-sound.json`, `data/afi.json`, and `data/criterion.json` at startup and accessed via `Map`/`Set` lookups by `imdbId`.

### Stage 2: Accessibility Scoring

**Location:** `accessibilityScore()` function in `src/index.ts`, delegating to 5 IRanker classes.

Orders the top-250 pool for a preteen viewer. Lower score = watch sooner.

| Ranker | Field | Multiplier | Key scores |
|---|---|---|---|
| `RatingRanker` | `rating` | 2.5 | G→0, PG→1, PG-13→2, R→4, unknown→3.5 |
| `DecadeRanker` | `year` | 1.2 | 2010+→0, 2000s→0.5, 1990s→1 … pre-1940→4 |
| `LengthRanker` | `length` | 1.0 | ≤90m→0, 91-120m→0.5, 121-150m→1, 151-180m→1.5, >180m→2 |
| `BlackAndWhiteRanker` | `blackAndWhite` | 1.0 | false→0, true→1 |
| `AnimationRanker` | `animated` | 1.0 | false→0, true→**−1** (bonus) |

`length` is stored as a string like `"1h 30m"` and parsed by `LengthRanker`.

### Key Types

**`Movie`** (`src/types/movie.ts`) — all fields optional:
```
imdbRank, imdbId, title, year, length, rating,
blackAndWhite, animated, rottenTomatoes, nytRank,
watched, genre, criterion
```
Note: `Movie.criterion` is a legacy field — Criterion membership is now sourced from `data/criterion.json`.

**`ScoredMovie`** (defined in `src/index.ts`) — extends Movie with:
- `qualityScore: number` — Stage 1 result
- `accessibilityScore: number` — Stage 2 result
- `onCanonicalList: boolean` — true if in Sight & Sound, AFI, or Criterion

**`RankedMovie`** (defined in `src/index.ts`) — extends ScoredMovie with:
- `overallRank: number` — 1-indexed position after Stage 2 sort

### Data Flow

1. Load `movies.json` and the three canonical list JSON files
2. Build `Map`/`Set` lookups by `imdbId` for O(1) canonical list access
3. Score every movie with `qualityScore()` → sort ascending → take top 250 (`POOL_SIZE`)
4. Score the pool with `accessibilityScore()` → sort ascending → assign `overallRank`
5. Partition into watched / unwatched
6. Write `MOVIES.md`

### Where to Make Changes

- **Add/adjust a quality signal** → edit `qualityScore()` in `src/index.ts`
- **Add/adjust an accessibility signal** → add/edit an IRanker class in `src/lib/`, import and call it in `accessibilityScore()` in `src/index.ts`
- **Add a new movie** → add an entry to `src/data/movies.json`
- **Mark a movie watched** → set `"watched": true` in its `movies.json` entry
- **Update IMDb data** → run `npm run update-imdb`

## Code Conventions

- **Classes:** PascalCase (e.g., `RatingRanker`, `AnimationRanker`)
- **Functions:** camelCase
- **Pattern:** Strategy pattern via IRanker for accessibility rankers; quality scoring is plain functions
- **Modules:** One class per file in `src/lib/`
- **Types:** Defined in `src/types/`
- **No linter or formatter configured** — follow existing code style

## Automated IMDb Updates

A GitHub Actions workflow (`.github/workflows/update-imdb-rankings.yml`) runs monthly on the 1st and can be triggered manually via `workflow_dispatch`.

1. Downloads IMDb bulk datasets (`title.ratings.tsv.gz`, `title.basics.tsv.gz`)
2. Computes Top 250 using IMDb's Bayesian weighted rating formula
3. Matches movies by `imdbId` (falls back to title+year if no ID yet)
4. Updates ranks, adds new entries, flags dropped movies
5. If `movies.json` changed, opens a PR on `automated/imdb-rankings-update`

New movies are added with default values (`rating: "Not Rated"`, `blackAndWhite: false`, `animated: false`, etc.) and should be reviewed manually before merging.

## Environment Variables

- `OMDBAPIKEY` — Required only for `scripts/fetch-rotten.js`. Loaded via `dotenv` from `.env`.

## Important Notes

- Never commit: `.env`, `.npmrc`, `node_modules/`, `update-summary.json`, `build/`
- Never edit `MOVIES.md` or `build/` directly — both are generated output
- `movies.json` is the single source of truth for per-movie data
- `imdbId` (e.g., `tt0111161`) is the stable identifier used for matching across all data sources
- There is no test suite — `npm test` is a placeholder
- Commit messages in this repo are casual and often note which movies have been watched
