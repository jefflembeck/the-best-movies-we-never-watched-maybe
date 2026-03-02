#!/usr/bin/env node
/**
 * seed-canonical-lists.js
 *
 * Reads the three canonical list files (Sight & Sound, AFI, Criterion)
 * and adds any films not already in movies.json as new entries with safe defaults.
 *
 * Safe to run repeatedly — idempotent (only adds, never overwrites).
 *
 * Usage: node scripts/seed-canonical-lists.js
 */

const fs = require("fs");
const path = require("path");

const MOVIES_PATH = path.join(__dirname, "..", "src", "data", "movies.json");
const SIGHT_AND_SOUND_PATH = path.join(__dirname, "..", "src", "data", "sight-and-sound.json");
const AFI_PATH = path.join(__dirname, "..", "src", "data", "afi.json");
const CRITERION_PATH = path.join(__dirname, "..", "src", "data", "criterion.json");

function main() {
  const movies = JSON.parse(fs.readFileSync(MOVIES_PATH, "utf-8"));
  const sightAndSound = JSON.parse(fs.readFileSync(SIGHT_AND_SOUND_PATH, "utf-8"));
  const afi = JSON.parse(fs.readFileSync(AFI_PATH, "utf-8"));
  const criterion = JSON.parse(fs.readFileSync(CRITERION_PATH, "utf-8"));

  // Build a set of all imdbIds already in movies.json for fast lookup
  const existingIds = new Set(movies.map((m) => m.imdbId).filter(Boolean));

  const added = [];

  // Collect all unique films from all three lists
  const allEntries = new Map();

  for (const entry of sightAndSound) {
    if (!allEntries.has(entry.imdbId)) {
      allEntries.set(entry.imdbId, { imdbId: entry.imdbId, title: entry.title, year: String(entry.year) });
    }
  }
  for (const entry of afi) {
    if (!allEntries.has(entry.imdbId)) {
      allEntries.set(entry.imdbId, { imdbId: entry.imdbId, title: entry.title, year: String(entry.year) });
    }
  }
  for (const entry of criterion) {
    if (!allEntries.has(entry.imdbId)) {
      allEntries.set(entry.imdbId, { imdbId: entry.imdbId, title: entry.title, year: String(entry.year) });
    }
  }

  for (const [imdbId, entry] of allEntries) {
    if (existingIds.has(imdbId)) continue;

    const newMovie = {
      imdbId: entry.imdbId,
      title: entry.title,
      year: entry.year,
      length: "N/A",
      rating: "Not Rated",
      blackAndWhite: false,
      animated: false,
      rottenTomatoes: "N/A",
      nytRank: "N/A",
      watched: false,
    };

    movies.push(newMovie);
    added.push(`"${entry.title}" (${entry.year}) — ${imdbId}`);
  }

  if (added.length === 0) {
    console.log("No new films to add — movies.json is already up to date.");
    return;
  }

  fs.writeFileSync(MOVIES_PATH, JSON.stringify(movies, null, 2) + "\n");
  console.log(`Added ${added.length} new films to movies.json:`);
  added.forEach((s) => console.log(`  + ${s}`));
  console.log("\nThese entries need manual review for: rating, blackAndWhite, animated, length.");
}

main();
