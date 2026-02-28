# CLAUDE.md

## Project Overview

A family movie ranking system that scores IMDb Top 250 movies for family viewing. It combines IMDb popularity, Rotten Tomatoes critics' scores, and The New York Times editorial rankings into a single "early-watch" score. Lower scores mean "watch sooner." The project is designed to help a family choose age-appropriate, entertaining movies for a preteen.

## Tech Stack

- **Language:** TypeScript (CommonJS modules)
- **Runtime:** Node.js 22+
- **Build:** `tsc` (TypeScript compiler)
- **Execution:** `ts-node` for direct TypeScript execution
- **Presentation:** reveal.js for slideshow output

## Repository Structure

```
src/
├── index.ts              # Main entry point — scoring, sorting, and output generation
├── types/
│   └── movie.ts          # Movie type definition
├── lib/
│   ├── iranker.ts         # IRanker interface (multiplier + rawToScore)
│   ├── imdb-ranker.ts     # IMDb rank scoring (weight: 0.2)
│   ├── rotten-tomato-ranker.ts  # RT score (weight: 0.3)
│   ├── nyt-ranker.ts      # NYT ranking (weight: 0.5)
│   ├── rating-ranker.ts   # MPAA rating scoring (weight: 2.5)
│   ├── decade-ranker.ts   # Release year scoring (weight: 1.2)
│   ├── length-ranker.ts   # Runtime scoring (weight: 1.0)
│   ├── black-and-white-ranker.ts  # B&W detection (weight: 1.0)
│   └── animation-ranker.ts       # Animation detection (weight: 1.0)
├── data/
│   └── movies.json        # Movie database (~250 movies)
scripts/
├── update-imdb-rankings.js  # Monthly IMDb Top 250 update (downloads IMDb datasets)
├── add-nyt-ranking.js       # Merges NYT rankings into movie data
└── fetch-rotten.js          # Fetches RT ratings via OMDb API (requires OMDBAPIKEY in .env)
.github/workflows/
└── update-imdb-rankings.yml # Monthly cron — runs update script and opens a PR
build/                       # Compiled JS output (generated)
reveal.js/                   # Presentation output directory
MOVIES.md                    # Generated ranked movie list
```

## Commands

- `npm run create-list` — Run the main scoring pipeline via `ts-node src/index.ts`. Generates the reveal.js presentation and `MOVIES.md`.
- `npm run update-imdb` — Download IMDb datasets and update rankings in `movies.json`. Adds new Top 250 entries and updates existing ranks.
- `npm run build` — Compile TypeScript to JavaScript in `build/`.
- `npm test` — Not yet implemented (placeholder only).

## Architecture

### Scoring System

All rankers implement the `IRanker` interface (`src/lib/iranker.ts`):

```typescript
interface IRanker {
  multiplier: number;
  rawToScore: (val: any) => number;
}
```

Each movie attribute is scored by its ranker, multiplied by its weight, and all components are summed. The `scoreMovie()` function in `src/index.ts` orchestrates this.

### Key Types

- `Movie` — Base movie data (`src/types/movie.ts`)
- `ScoredMovie` — Movie with `totalScore` (defined in `src/index.ts`)
- `RankedMovie` — ScoredMovie with `overallRank` (defined in `src/index.ts`)

### Data Flow

1. `movies.json` is loaded and parsed
2. Each movie is scored by all 8 rankers
3. Movies are sorted by score ascending (lower = watch sooner)
4. Partitioned into watched/unwatched
5. Output as both a reveal.js presentation and `MOVIES.md`

## Code Conventions

- **Classes:** PascalCase (e.g., `IMDBRanker`, `RottenTomatoesRanker`)
- **Functions:** camelCase
- **Pattern:** Strategy pattern via IRanker interface — each ranker is a separate class
- **Modules:** One class per file in `src/lib/`
- **Types:** Defined in `src/types/`
- **No linter or formatter configured** — follow existing code style

## Automated IMDb Updates

A GitHub Actions workflow (`.github/workflows/update-imdb-rankings.yml`) runs monthly on the 1st and can be triggered manually via `workflow_dispatch`.

**How it works:**
1. Downloads free IMDb bulk datasets (`title.ratings.tsv.gz` and `title.basics.tsv.gz`)
2. Computes the Top 250 using IMDb's Bayesian weighted rating formula
3. Matches existing movies by `imdbId` (falls back to title+year if no ID yet)
4. Updates ranks, adds new entries, flags dropped movies
5. If `movies.json` changed, opens a PR on the `automated/imdb-rankings-update` branch

**New movies** entering the Top 250 are added with default values (`rating: "Not Rated"`, `blackAndWhite: false`, `animated: false`, etc.) and should be reviewed manually in the PR before merging.

**The `imdbId` field** is a stable IMDb identifier (e.g., `tt0111161`) used for matching across updates. It is populated automatically on the first run via title+year matching. Movies that can't be matched are logged in the PR for manual resolution.

## Environment Variables

- `OMDBAPIKEY` — Required only for `scripts/fetch-rotten.js` (OMDb API key). Loaded via `dotenv` from `.env`.

## Important Notes

- `.env`, `.npmrc`, `node_modules`, and `update-summary.json` are gitignored — never commit these
- The `movies.json` file is the single source of truth for movie data
- When movies are watched, they are marked with `"watched": true` in `movies.json`
- Each movie may have an `imdbId` field (e.g., `tt0111161`) for stable identification across IMDb updates
- There is no test suite — the test script is a placeholder
- Commit messages in this repo are casual and track which movies have been watched
- The `build/` directory contains compiled output and should not be edited directly
