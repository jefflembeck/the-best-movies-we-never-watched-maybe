//!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const INPUT = path.join(__dirname, "../movies-with-rt-with-nyt.json");
const OUTPUT = path.join(__dirname, "../movies-ranked.json");

const movies = JSON.parse(fs.readFileSync(INPUT, "utf-8"));
const N = movies.length; // total movies
const M = 100; // NYT Top 100 scale

// normalize imdbRank (1…N → 0…1 where 0 is best)
function imdbNorm(rank) {
  return (rank - 1) / (N - 1);
}

// normalize Rotten Tomatoes (\"100%\" → 0, \"0%\" → 1)
function rtNorm(rtString) {
  const pct = parseFloat(rtString) / 100;
  return 1 - pct;
}

// normalize nytRank (1…100 → 0…1 where 0 is best; \"N/A\" → treated as 100)
function nytNorm(rankOrNA) {
  const raw = rankOrNA === "N/A" ? M : parseInt(rankOrNA, 10);
  const rank = isNaN(raw) ? M : raw;
  return (rank - 1) / (M - 1);
}

// weights: editorial (NYT) > critics (RT) > popularity (IMDb)
const wNYT = 0.5;
const wRT = 0.3;
const wIMDb = 0.2;

// compute a single early-watch score (lower = watch earlier)
const ranked = movies
  .map((m) => {
    const score =
      m.totalScore +
      nytNorm(m.nytRank) * wNYT +
      rtNorm(m.rottenTomatoes) * wRT +
      imdbNorm(m.imdbRank) * wIMDb;
    return { ...m, earlyScore: score };
  })
  .sort((a, b) => a.earlyScore - b.earlyScore);

// write out full ranked list
fs.writeFileSync(OUTPUT, JSON.stringify(ranked, null, 2), "utf-8");

console.log(`Wrote ${ranked.length} movies with earlyScore to ${OUTPUT}`);
console.log("Top 10 to watch next:");
ranked.slice(0, 10).forEach((m, i) => {
  console.log(
    `${i + 1}. ${m.title} ` +
      `(NYT: ${m.nytRank}, RT: ${m.rottenTomatoes}, ` +
      `IMDb: ${m.imdbRank}) → ` +
      `score=${m.earlyScore.toFixed(3)}`,
  );
});
