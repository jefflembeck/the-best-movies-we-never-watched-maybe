import * as path from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { Movie } from "./types/movie";
import { IMDBRanker } from "./lib/imdb-ranker";
import { DecadeRanker } from "./lib/decade-ranker";
import { LengthRanker } from "./lib/length-ranker";
import { RatingRanker } from "./lib/rating-ranker";
import { BlackAndWhiteRanker } from "./lib/black-and-white-ranker";
import { AnimationRanker } from "./lib/animation-ranker";
import { RottenTomatoesRanker } from "./lib/rotten-tomato-ranker";
import { NYTRanker } from "./lib/nyt-ranker";
import { IRanker } from "./lib/iranker";


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
  totalScore: number;
}

interface RankedMovie extends ScoredMovie {
  overallRank: number;
}

const moviesFile = readFileSync(path.join(__dirname, "data", "movies.json"), {
  encoding: "utf8",
});
const movies: Movie[] = JSON.parse(moviesFile);

const rankedMovies: RankedMovie[] = movies.map((m: Movie) => {
  return { ...m, totalScore: scoreMovie(m) };
}).sort((a: ScoredMovie, b) => {
  return a.totalScore - b.totalScore;
}).map((m: ScoredMovie, index) => {
  return {...m, overallRank: index + 1 };
});

const [watched, unwatched] = partition(rankedMovies, (m) => !!m.watched);

outputList(unwatched, watched);

function scoreMovie(m: Movie): number {
  const imdbScore = getScoreForAttribute(m.imdbRank, new IMDBRanker());
  const decadeScore = getScoreForAttribute(m.year, new DecadeRanker());
  const lengthScore = getScoreForAttribute(m.length, new LengthRanker());
  const ratingScore = getScoreForAttribute(m.rating, new RatingRanker());
  const blackAndWhiteScore = getScoreForAttribute(
    m.blackAndWhite,
    new BlackAndWhiteRanker(),
  );
  const animatedScore = getScoreForAttribute(m.animated, new AnimationRanker());
  const rtScore = getScoreForAttribute(
    m.rottenTomatoes,
    new RottenTomatoesRanker(),
  );
  const nytScore = getScoreForAttribute(m.nytRank, new NYTRanker());

  return (
    imdbScore +
    decadeScore +
    lengthScore +
    ratingScore +
    blackAndWhiteScore +
    animatedScore +
    rtScore +
    nytScore
  );
}

function getScoreForAttribute(attribute: any, ranker: IRanker) {
  return ranker.rawToScore(attribute) * ranker.multiplier;
}

function outputList(sortedMovies: RankedMovie[], watched: RankedMovie[]) {
  const open = `
# Movies

This is the list of movies!

`;

  const movies = sortedMovies.map((movie: RankedMovie) => {
    return `### #${movie.overallRank}: ${movie.title} (${movie.year})
- **MPAA Rating:** ${movie.rating}
- **Runtime:** ${movie.length}
- **Black and White:** ${movie.blackAndWhite}
- **Animated:** ${movie.animated}
- **RT:** ${movie.rottenTomatoes}
- **IMDB:** ${movie.imdbRank}
- **NYT:** ${movie.nytRank}
`
  });

  const watchedMovies = watched.map((movie: RankedMovie) => {
    return `### #${movie.overallRank}: ${movie.title} (${movie.year})
- **MPAA Rating:** ${movie.rating}
- **Runtime:** ${movie.length}
- **Black and White:** ${movie.blackAndWhite}
- **Animated:** ${movie.animated}
- **RT:** ${movie.rottenTomatoes}
- **IMDB:** ${movie.imdbRank}
- **NYT:** ${movie.nytRank}
`
  });
    

  writeFileSync("MOVIES.md", open + `## Unwatched` + `\n\n` + movies.join('\n\n') + '\n\n' + `## Watched` + `\n\n` + watchedMovies.join('\n\n'));
}
