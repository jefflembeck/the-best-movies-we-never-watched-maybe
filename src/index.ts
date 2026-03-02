import * as path from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { Movie } from "./types/movie";
import { DecadeRanker } from "./lib/decade-ranker";
import { LengthRanker } from "./lib/length-ranker";
import { RatingRanker } from "./lib/rating-ranker";
import { BlackAndWhiteRanker } from "./lib/black-and-white-ranker";
import { AnimationRanker } from "./lib/animation-ranker";
import { IRanker } from "./lib/iranker";

const POOL_SIZE = 250;

function partition<T>(
  array: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  for (const item of array) {
    (predicate(item) ? truthy : falsy).push(item);
  }
  return [truthy, falsy];
}

interface ScoredMovie extends Movie {
  qualityScore: number;
  accessibilityScore: number;
  onCanonicalList: boolean;
}

interface RankedMovie extends ScoredMovie {
  overallRank: number;
}

// ─── Load movie and canonical list data ───────────────────────────────────────

const moviesFile = readFileSync(path.join(__dirname, "data", "movies.json"), {
  encoding: "utf8",
});
const movies: Movie[] = JSON.parse(moviesFile);

interface CanonicalEntry {
  imdbId: string;
  title: string;
  year: number;
  rank?: number;
}

const sightAndSoundList: CanonicalEntry[] = JSON.parse(
  readFileSync(path.join(__dirname, "data", "sight-and-sound.json"), { encoding: "utf8" })
);
const afiList: CanonicalEntry[] = JSON.parse(
  readFileSync(path.join(__dirname, "data", "afi.json"), { encoding: "utf8" })
);
const criterionList: { imdbId: string; title: string; year: number }[] = JSON.parse(
  readFileSync(path.join(__dirname, "data", "criterion.json"), { encoding: "utf8" })
);

// Build lookup maps by imdbId for O(1) access
const sightAndSoundRank = new Map<string, number>(
  sightAndSoundList.map((e) => [e.imdbId, e.rank!])
);
const afiRank = new Map<string, number>(
  afiList.map((e) => [e.imdbId, e.rank!])
);
const criterionSet = new Set<string>(criterionList.map((e) => e.imdbId));

// ─── Stage 1: Quality scoring ─────────────────────────────────────────────────
// Answers: "Is this film culturally significant enough to be in the pool?"
// Lower score = more canonical. Take top POOL_SIZE films.
//
// Signals and weights:
//   Sight & Sound rank  weight 3.0   rank/250 (0.004–1.0), not listed → 1.5
//   Criterion           weight 2.5   listed → 0, not listed → 1.0
//   AFI rank            weight 2.0   rank/100 (0.01–1.0), not listed → 1.5
//   NYT rank            weight 2.0   rank/100 (0.01–1.0), not ranked → 1.0
//   RT score            weight 1.5   (100-score)/100 (0–1.0), unknown → 0.5
//   IMDb rank           weight 1.0   rank/500 (0.002–1.0), not ranked → 1.5

function qualityScore(m: Movie): number {
  const id = m.imdbId;

  // Sight & Sound
  const ssRank = id ? sightAndSoundRank.get(id) : undefined;
  const ssScore = ssRank !== undefined ? (ssRank / 250) * 3.0 : 1.5 * 3.0;

  // Criterion
  const criterionScore = id && criterionSet.has(id) ? 0 : 1.0 * 2.5;

  // AFI
  const afRank = id ? afiRank.get(id) : undefined;
  const afiScore = afRank !== undefined ? (afRank / 100) * 2.0 : 1.5 * 2.0;

  // NYT
  const nytVal = m.nytRank;
  const nytScore =
    !nytVal || nytVal === "N/A"
      ? 1.0 * 2.0
      : (parseFloat(nytVal) / 100) * 2.0;

  // Rotten Tomatoes
  const rtVal = m.rottenTomatoes;
  let rtScore: number;
  if (!rtVal || rtVal === "N/A") {
    rtScore = 0.5 * 1.5;
  } else {
    const pct = parseFloat(rtVal);
    rtScore = Number.isNaN(pct) ? 0.5 * 1.5 : (1 - pct / 100) * 1.5;
  }

  // IMDb
  const imdbScore =
    m.imdbRank !== undefined ? (m.imdbRank / 500) * 1.0 : 1.5 * 1.0;

  return ssScore + criterionScore + afiScore + nytScore + rtScore + imdbScore;
}

// ─── Stage 2: Accessibility scoring ──────────────────────────────────────────
// Answers: "In what order should we watch these for a preteen?"
// Lower score = more accessible / watch sooner.

function accessibilityScore(m: Movie): number {
  return (
    getScoreForAttribute(m.rating, new RatingRanker()) +
    getScoreForAttribute(m.length, new LengthRanker()) +
    getScoreForAttribute(m.year, new DecadeRanker()) +
    getScoreForAttribute(m.blackAndWhite, new BlackAndWhiteRanker()) +
    getScoreForAttribute(m.animated, new AnimationRanker())
  );
}

function getScoreForAttribute(attribute: any, ranker: IRanker) {
  return ranker.rawToScore(attribute) * ranker.multiplier;
}

// Stage 1: Quality-score all movies, take top POOL_SIZE
const scoredPool: ScoredMovie[] = movies
  .map((m: Movie) => ({
    ...m,
    qualityScore: qualityScore(m),
    accessibilityScore: accessibilityScore(m),
    onCanonicalList: !!(
      m.imdbId &&
      (sightAndSoundRank.has(m.imdbId) ||
        afiRank.has(m.imdbId) ||
        criterionSet.has(m.imdbId))
    ),
  }))
  .sort((a, b) => a.qualityScore - b.qualityScore)
  .slice(0, POOL_SIZE);

// Stage 2: Sort that pool by accessibility for a preteen viewer
const rankedMovies: RankedMovie[] = scoredPool
  .sort((a, b) => a.accessibilityScore - b.accessibilityScore)
  .map((m: ScoredMovie, index) => ({ ...m, overallRank: index + 1 }));

const [watched, unwatched] = partition(rankedMovies, (m) => !!m.watched);

outputList(unwatched, watched);

function formatMovieEntry(movie: RankedMovie): string {
  const badges: string[] = [];
  if (movie.onCanonicalList) {
    if (movie.imdbId && criterionSet.has(movie.imdbId)) badges.push("Criterion Collection");
    if (movie.nytRank && movie.nytRank !== "N/A") badges.push(`NYT #${movie.nytRank}`);
  }

  const badgeLine = badges.length > 0 ? `- **Notable:** ${badges.join(" · ")}\n` : "";
  const genreLine =
    movie.genre && movie.genre.length > 0
      ? `- **Genre:** ${movie.genre.join(", ")}\n`
      : "";

  return `### #${movie.overallRank}: ${movie.title} (${movie.year})
- **MPAA Rating:** ${movie.rating}
- **Runtime:** ${movie.length}
- **Black and White:** ${movie.blackAndWhite}
- **Animated:** ${movie.animated}
${genreLine}- **RT:** ${movie.rottenTomatoes}
- **IMDB:** ${movie.imdbRank}
- **NYT:** ${movie.nytRank}
${badgeLine}`;
}

function outputList(sortedMovies: RankedMovie[], watched: RankedMovie[]) {
  const open = `# Movies

This is the list of movies!

`;

  // Film as Literature section: films on Criterion, S&S, or AFI, sorted by quality score
  const filmAsLit = [...sortedMovies, ...watched]
    .filter((m) => m.onCanonicalList)
    .sort((a, b) => a.qualityScore - b.qualityScore)
    .slice(0, 30);

  const filmAsLitEntries = filmAsLit.map((movie) => {
    const badges: string[] = [];
    if (movie.imdbId && criterionSet.has(movie.imdbId)) badges.push("Criterion Collection");
    if (movie.nytRank && movie.nytRank !== "N/A") badges.push(`NYT #${movie.nytRank}`);
    return `### ${movie.title} (${movie.year}) — Watch order #${movie.overallRank}
- **MPAA Rating:** ${movie.rating}
- **Runtime:** ${movie.length}
- **Genre:** ${(movie.genre || []).join(", ")}
- **RT:** ${movie.rottenTomatoes}
${badges.length > 0 ? `- **Notable:** ${badges.join(" · ")}\n` : ""}`;
  });

  const unwatchedEntries = sortedMovies.map(formatMovieEntry);
  const watchedEntries = watched.map(formatMovieEntry);

  writeFileSync(
    "MOVIES.md",
    open +
      `## Film as Literature Picks\n\n*Top 30 most culturally significant films — on Criterion, Sight & Sound, or AFI lists — sorted by editorial standing.*\n\n` +
      filmAsLitEntries.join("\n") +
      `\n## Unwatched\n\n*${POOL_SIZE} films sorted by accessibility — most appropriate for a preteen first.*\n\n` +
      unwatchedEntries.join("\n\n") +
      `\n\n## Watched\n\n` +
      watchedEntries.join("\n\n")
  );
}
