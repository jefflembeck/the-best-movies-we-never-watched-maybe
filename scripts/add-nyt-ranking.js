#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const MOVIES_PATH = path.join(__dirname, "../movies-with-rt.json");
const NYT_PATH = path.join(__dirname, "../nytimesmoviedata.json");
const OUT_PATH = path.join(__dirname, "../movies-with-rt-with-nyt.json");

const DEFAULT_RANK = 100;

// Helper to normalize titles: lowercase, remove punctuation and spaces
function normalizeTitle(title) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Load JSON data
let movies, nytList;
try {
  movies = JSON.parse(fs.readFileSync(MOVIES_PATH, { encoding: "utf-8" }));
  nytList = JSON.parse(fs.readFileSync(NYT_PATH, { encoding: "utf-8" }));
} catch (e) {
  console.error(e);
}

// Build lookup map: normalized title -> numeric rank
const nytMap = nytList.reduce((map, entry) => {
  const key = normalizeTitle(entry.title);
  const rank = parseInt(entry.number, 10) || DEFAULT_RANK;
  map[key] = rank;
  return map;
}, {});

// Update each movie with nytRank
const updated = movies.map((movie) => {
  const key = normalizeTitle(movie.title);
  const inNyt = nytMap[key] !== undefined;
  const nytRank = inNyt ? nytMap[key] : "N/A";
  return {
    ...movie,
    inNyt,
    nytRank,
  };
});

// Write output file
fs.writeFileSync(OUT_PATH, JSON.stringify(updated, null, 2), "utf-8");
console.log(`Wrote ${updated.length} records to ${OUT_PATH}`);
