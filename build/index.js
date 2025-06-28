"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const imdb_ranker_1 = require("./lib/imdb-ranker");
const decade_ranker_1 = require("./lib/decade-ranker");
const length_ranker_1 = require("./lib/length-ranker");
const rating_ranker_1 = require("./lib/rating-ranker");
const black_and_white_ranker_1 = require("./lib/black-and-white-ranker");
const animation_ranker_1 = require("./lib/animation-ranker");
const rotten_tomato_ranker_1 = require("./lib/rotten-tomato-ranker");
const nyt_ranker_1 = require("./lib/nyt-ranker");
const moviesFile = (0, node_fs_1.readFileSync)("./data/movies.json", { encoding: 'utf8' });
const movies = JSON.parse(moviesFile);
const scoredMovies = movies.map((m) => {
    return { ...m, totalScore: scoreMovie(m) };
});
const sortedMovies = scoredMovies.sort((a, b) => {
    return a.totalScore - b.totalScore;
});
console.log(sortedMovies);
function scoreMovie(m) {
    const imdbRanker = new imdb_ranker_1.IMDBRanker();
    const imdbScore = imdbRanker.rawToScore(m.imdbRank) * imdbRanker.multiplier;
    const decadeRanker = new decade_ranker_1.DecadeRanker();
    const decadeScore = decadeRanker.rawToScore(m.year) * decadeRanker.multiplier;
    const lengthRanker = new length_ranker_1.LengthRanker();
    const lengthScore = lengthRanker.rawToScore(m.length) * lengthRanker.multiplier;
    const ratingRanker = new rating_ranker_1.RatingRanker();
    const ratingScore = ratingRanker.rawToScore(m.rating) * ratingRanker.multiplier;
    const blackAndWhiteRanker = new black_and_white_ranker_1.BlackAndWhiteRanker();
    const blackAndWhiteScore = blackAndWhiteRanker.rawToScore(m.blackAndWhite) * blackAndWhiteRanker.multiplier;
    const animatedRanker = new animation_ranker_1.AnimationRanker();
    const animatedScore = animatedRanker.rawToScore(m.animated) * animatedRanker.multiplier;
    const rottenTomatoRanker = new rotten_tomato_ranker_1.RottenTomatoesRanker();
    const rtScore = rottenTomatoRanker.rawToScore(m.rottenTomatoes) * rottenTomatoRanker.multiplier;
    const nytRanker = new nyt_ranker_1.NYTRanker();
    const nytScore = nytRanker.rawToScore(m.nytRank) * nytRanker.multiplier;
    return imdbScore +
        decadeScore +
        lengthScore +
        ratingScore +
        blackAndWhiteScore +
        animatedScore +
        rtScore +
        nytScore;
}
