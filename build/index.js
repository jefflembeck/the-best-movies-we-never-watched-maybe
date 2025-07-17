"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("node:path"));
const node_fs_1 = require("node:fs");
const imdb_ranker_1 = require("./lib/imdb-ranker");
const decade_ranker_1 = require("./lib/decade-ranker");
const length_ranker_1 = require("./lib/length-ranker");
const rating_ranker_1 = require("./lib/rating-ranker");
const black_and_white_ranker_1 = require("./lib/black-and-white-ranker");
const animation_ranker_1 = require("./lib/animation-ranker");
const rotten_tomato_ranker_1 = require("./lib/rotten-tomato-ranker");
const nyt_ranker_1 = require("./lib/nyt-ranker");
function partition(array, predicate) {
    const truthy = [];
    const falsy = [];
    for (const item of array) {
        (predicate(item) ? truthy : falsy).push(item);
    }
    return [truthy, falsy];
}
const moviesFile = (0, node_fs_1.readFileSync)(path.join(__dirname, "data", "movies.json"), {
    encoding: "utf8",
});
const movies = JSON.parse(moviesFile);
const rankedMovies = movies.map((m) => {
    return { ...m, totalScore: scoreMovie(m) };
}).sort((a, b) => {
    return a.totalScore - b.totalScore;
}).map((m, index) => {
    return { ...m, overallRank: index + 1 };
});
const [watched, unwatched] = partition(rankedMovies, (m) => !!m.watched);
outputToPresentation(unwatched);
outputList(unwatched, watched);
function scoreMovie(m) {
    const imdbScore = getScoreForAttribute(m.imdbRank, new imdb_ranker_1.IMDBRanker());
    const decadeScore = getScoreForAttribute(m.year, new decade_ranker_1.DecadeRanker());
    const lengthScore = getScoreForAttribute(m.length, new length_ranker_1.LengthRanker());
    const ratingScore = getScoreForAttribute(m.rating, new rating_ranker_1.RatingRanker());
    const blackAndWhiteScore = getScoreForAttribute(m.blackAndWhite, new black_and_white_ranker_1.BlackAndWhiteRanker());
    const animatedScore = getScoreForAttribute(m.animated, new animation_ranker_1.AnimationRanker());
    const rtScore = getScoreForAttribute(m.rottenTomatoes, new rotten_tomato_ranker_1.RottenTomatoesRanker());
    const nytScore = getScoreForAttribute(m.nytRank, new nyt_ranker_1.NYTRanker());
    return (imdbScore +
        decadeScore +
        lengthScore +
        ratingScore +
        blackAndWhiteScore +
        animatedScore +
        rtScore +
        nytScore);
}
function getScoreForAttribute(attribute, ranker) {
    return ranker.rawToScore(attribute) * ranker.multiplier;
}
function outputToPresentation(scoredMovies) {
    generatePresentationMarkdown(scoredMovies);
}
function generatePresentationMarkdown(sortedMovies) {
    const top15 = sortedMovies.slice(0, 15);
    const slides = [];
    // Title Slide
    slides.push(`# The Best Movies We've Never Watched (Maybe)\n\nA Lembeck Family journey through the IMDb Top 250\n`);
    const ratingRanker = new rating_ranker_1.RatingRanker();
    const blackAndWhiteRanker = new black_and_white_ranker_1.BlackAndWhiteRanker();
    const decadeRanker = new decade_ranker_1.DecadeRanker();
    const lengthRanker = new length_ranker_1.LengthRanker();
    const animatedRanker = new animation_ranker_1.AnimationRanker();
    const nytRanker = new nyt_ranker_1.NYTRanker();
    const rtRanker = new rotten_tomato_ranker_1.RottenTomatoesRanker();
    const imdbRanker = new imdb_ranker_1.IMDBRanker();
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
  `);
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
    slides.push(`## Top 15 Movies (According to Our Score)\n\n_`);
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
    const outputPath = path.join(__dirname, "..", "..", "reveal.js", "index.html");
    (0, node_fs_1.writeFileSync)(outputPath, open + content + close);
    console.log("✅ presentation.md written!");
}
function outputList(sortedMovies, watched) {
    const open = `
# Movies

This is the list of movies!

`;
    const movies = sortedMovies.map((movie) => {
        return `### #${movie.overallRank}: ${movie.title} (${movie.year})
- **MPAA Rating:** ${movie.rating}
- **Runtime:** ${movie.length}
- **Black and White:** ${movie.blackAndWhite}
- **Animated:** ${movie.animated}
- **RT:** ${movie.rottenTomatoes}
- **IMDB:** ${movie.imdbRank}
- **NYT:** ${movie.nytRank}
`;
    });
    const watchedMovies = watched.map((movie) => {
        return `### #${movie.overallRank}: ${movie.title} (${movie.year})
- **MPAA Rating:** ${movie.rating}
- **Runtime:** ${movie.length}
- **Black and White:** ${movie.blackAndWhite}
- **Animated:** ${movie.animated}
- **RT:** ${movie.rottenTomatoes}
- **IMDB:** ${movie.imdbRank}
- **NYT:** ${movie.nytRank}
`;
    });
    (0, node_fs_1.writeFileSync)("MOVIES.md", open + `## Unwatched` + `\n\n` + movies.join('\n\n') + '\n\n' + `## Watched` + `\n\n` + watchedMovies.join('\n\n'));
}
