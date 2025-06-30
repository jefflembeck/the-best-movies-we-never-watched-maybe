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

const moviesFile = readFileSync(path.join(__dirname, "data", "movies.json"), {
  encoding: "utf8",
});
const movies: Movie[] = JSON.parse(moviesFile);

interface ScoredMovie extends Movie {
  totalScore: number;
}

const scoredMovies: ScoredMovie[] = movies.filter((m: Movie) => {
  return !m.watched;
}).map((m: Movie) => {
  return { ...m, totalScore: scoreMovie(m) };
});

const sortedMovies = scoredMovies.sort((a: ScoredMovie, b: ScoredMovie) => {
  return a.totalScore - b.totalScore;
});

const watched = movies.filter((m: Movie) => { return !!m.watched; });

outputToPresentation(sortedMovies);
outputList(sortedMovies, watched);

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

function outputToPresentation(scoredMovies: ScoredMovie[]) {
  generatePresentationMarkdown(scoredMovies);
}

function generatePresentationMarkdown(sortedMovies: ScoredMovie[]) {
  const top15 = sortedMovies.slice(0, 15);

  const slides: string[] = [];

  // Title Slide
  slides.push(
    `# The Best Movies We've Never Watched (Maybe)\n\nA Lembeck Family journey through the IMDb Top 250\n`,
  );

  const ratingRanker = new RatingRanker();
  const blackAndWhiteRanker = new BlackAndWhiteRanker();
  const decadeRanker = new DecadeRanker();
  const lengthRanker = new LengthRanker();
  const animatedRanker = new AnimationRanker();
  const nytRanker = new NYTRanker();
  const rtRanker = new RottenTomatoesRanker();
  const imdbRanker = new IMDBRanker();

  // Methodology
  slides.push(`## Methodology

  Each movie is evaluated across several components:

  - **IMDb Rank**
  - **Rotten Tomatoes Score**
  - **NYT Rank**
  - **MPAA Rating**
  - **Length**
  - **Animation**
  - **Decade Released**
  - **Black & White**
  `)

  slides.push(`## Methodology

Each components is normalized, then weighted based on trust and value:

- **MPAA Rating:** ${ratingRanker.multiplier.toFixed(2)}
- **Length:** ${lengthRanker.multiplier.toFixed(2)}
- **Animation:** ${animatedRanker.multiplier.toFixed(2)}
- **Decade Released:** ${animatedRanker.multiplier.toFixed(2)}
- **Black & White:** ${animatedRanker.multiplier.toFixed(2)}
- **NYT:** ${nytRanker.multiplier.toFixed(2)}
- **RT:** ${rtRanker.multiplier.toFixed(2)}
- **IMDb:** ${imdbRanker.multiplier.toFixed(2)}
`);


  // Ranking System
  slides.push(`## Methodology

The final score is composed by adding together normalized scores and modifiers.

Lower scores mean: _watch this sooner_.`);

  // Component Scoring

  slides.push(`## Component Scoring (Examples)

- **"G" Rating** → 0 × ${ratingRanker.multiplier}
- **Black & White** → 1 × ${blackAndWhiteRanker.multiplier}
- **Post-2009** → 0 × ${decadeRanker.multiplier}
- **< 90 min** → 0 × ${lengthRanker.multiplier}
- **Animated** → -1 × ${animatedRanker.multiplier}`);

  slides.push(`
    ## Additional Proposal: We watch sequels and earlier movies in a set.

    If there is a sequel that comes earlier, we just watch all of the movies together.
    Sometimes this means watching one that is OK (see: Toy Story 2), but not on the list
   `);

  // Now show top 15
  slides.push(
    `## Top 15 Movies (According to Our Score)\n\n_`,
  );

  top15.forEach((movie, index) => {
    slides.push(`### #${index + 1}: ${movie.title} (${movie.year})

- **MPAA Rating:** ${movie.rating}
- **Runtime:** ${movie.length}
`);
  });


  // Output to file
  const open = `
    <!doctype html>
    <html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

		<title>reveal.js</title>

		<link rel="stylesheet" href="dist/reset.css">
		<link rel="stylesheet" href="dist/reveal.css">
		<link rel="stylesheet" href="dist/theme/black.css">

		<!-- Theme used for syntax highlighted code -->
		<link rel="stylesheet" href="plugin/highlight/monokai.css">
	</head>
	<body>
		<div class="reveal">
			<div class="slides">

    <section data-markdown>
      <textarea data-template>
    `;
  const content = `---\n${slides.join("\n---\n")}\n`;
  const close = `
    </textarea>
    </section>
			</div>
		</div>

		<script src="dist/reveal.js"></script>
		<script src="plugin/notes/notes.js"></script>
		<script src="plugin/markdown/markdown.js"></script>
		<script src="plugin/highlight/highlight.js"></script>
		<script>
			// More info about initialization & config:
			// - https://revealjs.com/initialization/
			// - https://revealjs.com/config/
			Reveal.initialize({
				hash: true,

				// Learn about plugins: https://revealjs.com/plugins/
				plugins: [ RevealMarkdown, RevealHighlight, RevealNotes ]
			});
		</script>
	</body>
</html>
`;
  const outputPath = path.join(
    __dirname,
    "..",
    "..",
    "reveal.js",
    "index.html",
  );
  writeFileSync(outputPath, open + content + close);

  console.log("✅ presentation.md written!");
}

function outputList(sortedMovies: ScoredMovie[], watched: Movie[]) {
  const open = `
  # Movies
  
  This is the list of movies!
  `;

  const movies = sortedMovies.map((movie, index) => {
    return `
    ### #${index + 1}: ${movie.title} (${movie.year})

    - **MPAA Rating:** ${movie.rating}
    - **Runtime:** ${movie.length}
    - **Black and White:** ${movie.blackAndWhite}
    - **Animated:** ${movie.animated}
    - **RT:** ${movie.rottenTomatoes}
    - **IMDB:** ${movie.imdbRank}
    - **NYT:** ${movie.nytRank}`
  });

  const watchedMovies = watched.map((movie: Movie, index) => {
    return `
    ### #${index + 1}: ${movie.title} (${movie.year})
    - **MPAA Rating:** ${movie.rating}
    - **Runtime:** ${movie.length}
    - **Black and White:** ${movie.blackAndWhite}
    - **Animated:** ${movie.animated}
    - **RT:** ${movie.rottenTomatoes}
    - **IMDB:** ${movie.imdbRank}
    - **NYT:** ${movie.nytRank}`
  });
    

  writeFileSync("MOVIES.md", open + movies.join('\n\n') + '\n\n' + `## Watched` + `\n\n` + watchedMovies.join('\n\n'));
}
