const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
dotenv.config();

const API_KEY = process.env.OMDBAPIKEY;
const INPUT_FILE = path.join(__dirname, "..", "movies.json");
const OUTPUT_FILE = path.join(__dirname, "..", "movies-with-rt.json");

async function fetchRottenTomatoesRatings() {
  const movies = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));
  const results = [];

  for (const movie of movies) {
    const { title, year } = movie;
    const params = new URLSearchParams({
      apikey: API_KEY,
      t: title,
      y: year,
    });

    try {
      const response = await fetch(`http://www.omdbapi.com/?${params}`);
      const data = await response.json();

      const rtEntry = Array.isArray(data.Ratings)
        ? data.Ratings.find((r) => r.Source === "Rotten Tomatoes")
        : null;

      const rottenTomatoes = rtEntry ? rtEntry.Value : "N/A";
      console.log(`Fetched RT for ${title} (${year}): ${rottenTomatoes}`);

      results.push({ ...movie, rottenTomatoes });
    } catch (err) {
      console.error(`Error fetching RT for ${title} (${year}):`, err);
      results.push({ ...movie, rottenTomatoes: "Error" });
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), "utf-8");
  console.log(`All done. Results written to ${OUTPUT_FILE}`);
}

fetchRottenTomatoesRatings();
