# The Best Movies We Never Watched (Maybe)

## Background

I have a kid. She's a preteen. My wife and I want to watch famous and good movies with her on our movie nights, but many aren't appropriate. Many are too long. Many are something she'd get bored with. So, let's make this into something where we watch great movies in a way where we are constantly entertained and where it's not weird to watch it.

This project scores movies in two stages: first filtering down to a pool of culturally significant films, then ordering that pool by how accessible they are for a preteen viewer.

## Usage

```bash
npm run create-list
```

Generates `MOVIES.md` and a reveal.js presentation with unwatched movies sorted by accessibility, followed by already-watched films.

## How the Scoring Works

### Stage 1: Quality Score (Cultural Significance)

All movies are scored for cultural significance. The top 250 form the candidate pool. **Lower score = more canonical.**

| Signal | Weight | Scoring |
|---|---|---|
| Sight & Sound rank | 3.0 | `rank / 250` (0.004–1.0); not listed → 1.5 |
| Criterion Collection | 2.5 | listed → 0; not listed → 1.0 |
| AFI rank | 2.0 | `rank / 100` (0.01–1.0); not listed → 1.5 |
| NYT rank | 2.0 | `rank / 100` (0.01–1.0); not ranked → 1.0 |
| Rotten Tomatoes | 1.5 | `(100 − score) / 100` (0–1.0); unknown → 0.5 |
| IMDb rank | 1.0 | `rank / 500` (0.002–1.0); not ranked → 1.5 |

### Stage 2: Accessibility Score (Watch Order)

Within the pool of 250, films are sorted by how accessible they are for a preteen. **Lower score = watch sooner.**

#### MPAA Rating — multiplier 2.5

| Rating | Score |
|---|---|
| G | 0 |
| PG | 1 |
| PG-13 | 2 |
| Approved | 2.5 |
| Not Rated / unknown | 3.5 |
| Passed | 3.5 |
| R | 4 |
| TV-MA | 5.5 |
| NC-17 | 7 |

#### Runtime — multiplier 1.0

| Length | Score |
|---|---|
| ≤ 90 mins | 0 |
| 91–120 mins | 0.5 |
| 121–150 mins | 1 |
| 151–180 mins | 1.5 |
| > 180 mins | 2 |

#### Decade — multiplier 1.2

Newer films score lower on the assumption that more recent pacing is easier for a preteen to engage with.

| Era | Score |
|---|---|
| 2010s–present | 0 |
| 2000s | 0.5 |
| 1990s | 1 |
| 1980s | 1.5 |
| 1970s | 2 |
| 1960s | 2.5 |
| 1950s | 3 |
| 1940s | 3.5 |
| Pre-1940 | 4 |

#### Black & White — multiplier 1.0

| | Score |
|---|---|
| Color | 0 |
| Black & White | 1 |

#### Animated — multiplier 1.0

Animated films get a small bonus (negative score) on the assumption they're more engaging for younger viewers.

| | Score |
|---|---|
| Not animated | 0 |
| Animated | −1 |

## Repository Structure

```
src/
├── index.ts                      # Main entry — scoring, sorting, output
├── types/movie.ts                # Movie type
├── lib/
│   ├── iranker.ts                # IRanker interface
│   ├── rating-ranker.ts          # MPAA rating (weight 2.5)
│   ├── length-ranker.ts          # Runtime (weight 1.0)
│   ├── decade-ranker.ts          # Release year (weight 1.2)
│   ├── black-and-white-ranker.ts # B&W flag (weight 1.0)
│   └── animation-ranker.ts       # Animated flag (weight 1.0)
└── data/
    ├── movies.json               # Movie database
    ├── sight-and-sound.json      # Sight & Sound top films
    ├── afi.json                  # AFI top 100
    └── criterion.json            # Criterion Collection titles
scripts/
├── update-imdb-rankings.js       # Monthly IMDb Top 250 update
├── add-nyt-ranking.js            # Merges NYT rankings into movie data
└── fetch-rotten.js               # Fetches RT ratings via OMDb API
```

## Data

`movies.json` is the single source of truth. Mark a film as watched by setting `"watched": true`. Movies are identified by their `imdbId` (e.g. `tt0111161`) for stable cross-update matching.

The IMDb rankings update automatically on the 1st of each month via a GitHub Actions workflow that opens a PR with any changes.
