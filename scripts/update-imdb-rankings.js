#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { Readable } = require("stream");
const readline = require("readline");

const IMDB_RATINGS_URL = "https://datasets.imdbws.com/title.ratings.tsv.gz";
const IMDB_BASICS_URL = "https://datasets.imdbws.com/title.basics.tsv.gz";
const MIN_VOTES = 25000;
const TOP_N = 250;

const MOVIES_PATH = path.join(__dirname, "..", "src", "data", "movies.json");
const SUMMARY_PATH = path.join(__dirname, "..", "update-summary.json");
const OMDB_API_KEY = process.env.OMDBAPIKEY;

/**
 * Fetch the MPAA rating for a movie from OMDb by IMDb ID.
 * Returns the rating string (e.g. "PG-13") or "Not Rated" if unavailable.
 */
async function fetchMPAARating(imdbId) {
  if (!OMDB_API_KEY) return "Not Rated";

  try {
    const params = new URLSearchParams({ apikey: OMDB_API_KEY, i: imdbId });
    const response = await fetch(`http://www.omdbapi.com/?${params}`);
    const data = await response.json();

    if (data.Response !== "False" && data.Rated && data.Rated !== "N/A" && data.Rated !== "Not Rated" && data.Rated !== "Unrated") {
      return data.Rated;
    }
  } catch (err) {
    console.log(`    Warning: OMDb lookup failed for ${imdbId}: ${err.message}`);
  }
  return "Not Rated";
}

/**
 * Download a gzipped TSV from a URL and call handler for each data row.
 */
async function parseTSVFromURL(url, handler) {
  console.log(`Downloading ${url} ...`);
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const nodeStream = Readable.fromWeb(response.body);
  const gunzip = zlib.createGunzip();
  const rl = readline.createInterface({ input: nodeStream.pipe(gunzip) });

  let headers = [];
  let isFirst = true;

  for await (const line of rl) {
    if (isFirst) {
      headers = line.split("\t");
      isFirst = false;
      continue;
    }
    handler(line.split("\t"), headers);
  }

  return headers;
}

function normalizeTitle(title) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatRuntime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

async function main() {
  // Step 1: Load ratings, keep only titles with enough votes
  console.log("Step 1: Loading IMDb ratings...");
  const ratings = new Map();

  await parseTSVFromURL(IMDB_RATINGS_URL, (fields) => {
    const numVotes = parseInt(fields[2], 10);
    if (numVotes >= MIN_VOTES) {
      ratings.set(fields[0], {
        tconst: fields[0],
        averageRating: parseFloat(fields[1]),
        numVotes,
      });
    }
  });

  console.log(`  Found ${ratings.size} titles with >= ${MIN_VOTES} votes`);

  // Step 2: Load title basics, keep only movies that passed the vote filter
  console.log("Step 2: Loading IMDb title basics...");
  const titles = new Map();

  await parseTSVFromURL(IMDB_BASICS_URL, (fields) => {
    const tconst = fields[0];
    const titleType = fields[1];
    if (titleType === "movie" && ratings.has(tconst)) {
      titles.set(tconst, {
        tconst,
        primaryTitle: fields[2],
        originalTitle: fields[3],
        startYear: fields[5],
        runtimeMinutes: fields[7],
      });
    }
  });

  console.log(`  Found ${titles.size} qualifying movies`);

  // Step 3: Compute weighted ratings using IMDb's Bayesian average
  //   W = (R × v + C × m) / (v + m)
  //   C = mean rating across qualifying movies
  //   m = minimum vote threshold
  console.log("Step 3: Computing weighted ratings...");

  let totalRating = 0;
  let count = 0;
  for (const [tconst, rating] of ratings) {
    if (titles.has(tconst)) {
      totalRating += rating.averageRating;
      count++;
    }
  }
  const C = totalRating / count;

  const rankedTitles = [];
  for (const [tconst, title] of titles) {
    const rating = ratings.get(tconst);
    const R = rating.averageRating;
    const v = rating.numVotes;
    const W = (R * v + C * MIN_VOTES) / (v + MIN_VOTES);

    rankedTitles.push({
      tconst,
      title: title.primaryTitle,
      originalTitle: title.originalTitle,
      year: title.startYear,
      weightedRating: W,
      runtimeMinutes: title.runtimeMinutes,
    });
  }

  rankedTitles.sort((a, b) => b.weightedRating - a.weightedRating);
  const top250 = rankedTitles.slice(0, TOP_N);

  console.log("\n  Top 10 by weighted rating:");
  top250.slice(0, 10).forEach((t, i) => {
    console.log(
      `    ${i + 1}. ${t.title} (${t.year}) — ${t.weightedRating.toFixed(3)}`
    );
  });

  // Step 4: Load existing movies.json
  console.log("\nStep 4: Loading existing movies.json...");
  const existingMovies = JSON.parse(fs.readFileSync(MOVIES_PATH, "utf-8"));
  console.log(`  ${existingMovies.length} movies in file`);

  // Step 5: Build lookup maps for matching
  const imdbIdToRank = new Map();
  const titleYearToEntry = new Map();

  top250.forEach((entry, index) => {
    imdbIdToRank.set(entry.tconst, index + 1);

    // Index by both primary and original title for matching
    const key1 = `${normalizeTitle(entry.title)}|${entry.year}`;
    titleYearToEntry.set(key1, entry);
    if (entry.originalTitle !== entry.title) {
      const key2 = `${normalizeTitle(entry.originalTitle)}|${entry.year}`;
      titleYearToEntry.set(key2, entry);
    }
  });

  // Step 6: Match existing movies and update ranks
  console.log("\nStep 5: Matching and updating...");
  const changes = [];
  const newMovies = [];
  const droppedMovies = [];
  const unmatchedExisting = [];
  const matchedImdbIds = new Set();

  for (const movie of existingMovies) {
    let matched = undefined;

    // Try matching by imdbId first
    if (movie.imdbId) {
      const rank = imdbIdToRank.get(movie.imdbId);
      if (rank !== undefined) {
        matched = top250[rank - 1];
        matchedImdbIds.add(movie.imdbId);
      }
    }

    // Fall back to title+year matching
    if (!matched && movie.title && movie.year) {
      const key = `${normalizeTitle(movie.title)}|${movie.year}`;
      const entry = titleYearToEntry.get(key);
      if (entry) {
        matched = entry;
        movie.imdbId = entry.tconst;
        matchedImdbIds.add(entry.tconst);
        changes.push(`Added imdbId ${entry.tconst} to "${movie.title}"`);
      }
    }

    if (matched) {
      const newRank = top250.indexOf(matched) + 1;
      if (movie.imdbRank !== newRank) {
        const oldRank = movie.imdbRank;
        changes.push(
          `"${movie.title}" rank: ${oldRank ?? "unranked"} -> ${newRank}`
        );
        movie.imdbRank = newRank;
      }
    } else {
      // Movie is in our list but didn't match anything in the Top 250
      if (movie.imdbId) {
        // Had an ID but dropped out of Top 250
        droppedMovies.push(`"${movie.title}" (was #${movie.imdbRank})`);
        movie.imdbRank = undefined;
      } else {
        // Never had an ID — could not match by title+year
        unmatchedExisting.push(`"${movie.title}" (${movie.year})`);
      }
    }
  }

  // Step 7: Add new movies entering the Top 250
  if (OMDB_API_KEY) {
    console.log("\n  OMDb API key found — will fetch MPAA ratings for new movies");
  } else {
    console.log("\n  No OMDb API key — new movies will default to 'Not Rated'");
  }

  for (const entry of top250) {
    if (!matchedImdbIds.has(entry.tconst)) {
      const runtime =
        entry.runtimeMinutes !== "\\N"
          ? formatRuntime(parseInt(entry.runtimeMinutes, 10))
          : "N/A";

      const rating = await fetchMPAARating(entry.tconst);

      const newMovie = {
        imdbId: entry.tconst,
        imdbRank: top250.indexOf(entry) + 1,
        title: entry.title,
        year: entry.year,
        length: runtime,
        rating,
        blackAndWhite: false,
        animated: false,
        rottenTomatoes: "N/A",
        nytRank: "N/A",
        watched: false,
      };

      existingMovies.push(newMovie);
      const ratingNote = rating !== "Not Rated" ? ` [${rating}]` : " [needs rating]";
      newMovies.push(
        `"${entry.title}" (${entry.year}) — NEW at #${top250.indexOf(entry) + 1}${ratingNote}`
      );
    }
  }

  // Step 7b: Backfill MPAA ratings for existing movies missing them
  if (OMDB_API_KEY) {
    const needsRating = existingMovies.filter(
      (m) => (!m.rating || m.rating === "Not Rated") && m.imdbId
    );
    if (needsRating.length > 0) {
      console.log(`\n  Backfilling MPAA ratings for ${needsRating.length} existing movies...`);
      for (const movie of needsRating) {
        const rating = await fetchMPAARating(movie.imdbId);
        if (rating !== "Not Rated") {
          console.log(`    MPAA: "${movie.title}" -> ${rating}`);
          movie.rating = rating;
        }
      }
    }
  }

  // Step 8: Write updated movies.json
  fs.writeFileSync(MOVIES_PATH, JSON.stringify(existingMovies, null, 2) + "\n");

  // Step 9: Print and save summary
  console.log("\n=== Update Summary ===");
  console.log(`Rank changes: ${changes.length}`);
  changes.forEach((c) => console.log(`  ${c}`));

  if (newMovies.length > 0) {
    console.log(
      `\nNew movies added (need manual review for rating/blackAndWhite/animated):`
    );
    newMovies.forEach((n) => console.log(`  * ${n}`));
  }

  if (droppedMovies.length > 0) {
    console.log("\nMovies dropped from Top 250:");
    droppedMovies.forEach((d) => console.log(`  ${d}`));
  }

  if (unmatchedExisting.length > 0) {
    console.log(
      "\nExisting movies that could not be matched (may need manual imdbId):"
    );
    unmatchedExisting.forEach((u) => console.log(`  ? ${u}`));
  }

  const summary = {
    date: new Date().toISOString().split("T")[0],
    rankChanges: changes.length,
    newMovies,
    droppedMovies,
    unmatchedExisting,
    changes,
  };

  fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));
  console.log(`\nSummary written to ${SUMMARY_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
