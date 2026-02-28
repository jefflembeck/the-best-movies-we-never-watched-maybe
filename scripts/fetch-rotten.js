const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
dotenv.config();

const API_KEY = process.env.OMDBAPIKEY;
const MOVIES_PATH = path.join(__dirname, "..", "src", "data", "movies.json");

async function fetchOMDbData() {
  if (!API_KEY) {
    console.error("OMDBAPIKEY environment variable is required. Set it in .env");
    process.exit(1);
  }

  const movies = JSON.parse(fs.readFileSync(MOVIES_PATH, "utf-8"));
  let rtUpdates = 0;
  let ratingUpdates = 0;

  for (const movie of movies) {
    const { title, year } = movie;

    // Use IMDb ID for lookup when available (more reliable), fall back to title+year
    const params = new URLSearchParams({ apikey: API_KEY });
    if (movie.imdbId) {
      params.set("i", movie.imdbId);
    } else {
      params.set("t", title);
      params.set("y", year);
    }

    try {
      const response = await fetch(`http://www.omdbapi.com/?${params}`);
      const data = await response.json();

      if (data.Response === "False") {
        console.log(`  No OMDb result for "${title}" (${year}): ${data.Error}`);
        continue;
      }

      // Update Rotten Tomatoes score if missing
      if (!movie.rottenTomatoes || movie.rottenTomatoes === "N/A") {
        const rtEntry = Array.isArray(data.Ratings)
          ? data.Ratings.find((r) => r.Source === "Rotten Tomatoes")
          : null;

        if (rtEntry) {
          movie.rottenTomatoes = rtEntry.Value;
          rtUpdates++;
          console.log(`  RT: "${title}" -> ${rtEntry.Value}`);
        }
      }

      // Update MPAA rating if missing or "Not Rated" and OMDb has a real rating
      if ((!movie.rating || movie.rating === "Not Rated") && data.Rated && data.Rated !== "N/A" && data.Rated !== "Not Rated" && data.Rated !== "Unrated") {
        const oldRating = movie.rating;
        movie.rating = data.Rated;
        ratingUpdates++;
        console.log(`  MPAA: "${title}" -> ${data.Rated} (was ${oldRating})`);
      }
    } catch (err) {
      console.error(`  Error fetching data for "${title}" (${year}):`, err.message);
    }
  }

  fs.writeFileSync(MOVIES_PATH, JSON.stringify(movies, null, 2) + "\n", "utf-8");
  console.log(`\nDone. Updated ${rtUpdates} RT scores and ${ratingUpdates} MPAA ratings.`);
  console.log(`Written to ${MOVIES_PATH}`);
}

fetchOMDbData();
