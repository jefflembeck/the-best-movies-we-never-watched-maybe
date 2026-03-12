#!/usr/bin/env node
// One-time script to transform sight-and-sound-raw.json into the same format as sight-and-sound.json

const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/sight-and-sound-raw.json'), 'utf8'));
const existing = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/sight-and-sound.json'), 'utf8'));
const movies = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/movies.json'), 'utf8'));

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Build normalized title -> imdbId lookup from existing sight-and-sound.json
const lookupByTitle = new Map();
for (const m of existing) {
  lookupByTitle.set(normalize(m.title), m.imdbId);
}
// Supplement with movies.json
for (const m of movies) {
  if (m.imdbId) {
    const key = normalize(m.title);
    if (!lookupByTitle.has(key)) lookupByTitle.set(key, m.imdbId);
  }
}

// Hardcoded imdbIds for films that need special handling
// (different titles between raw and reference files, or not in any reference)
const hardcodedByNormTitle = new Map([
  // Title differences between raw and existing/movies
  [normalize('La Règle du jeu'), 'tt0031885'],         // "The Rules of the Game" in existing
  [normalize('Mulholland Dr.'), 'tt0166924'],           // "Mulholland Drive" in existing
  [normalize('La dolce vita'), 'tt0053779'],            // case diff
  [normalize('À bout de souffle'), 'tt0053472'],        // "Breathless" in existing
  [normalize('Once upon a Time in the West'), 'tt0063442'],
  [normalize('CHUNGKING EXPRESS'), 'tt0109424'],        // "Chungking Express" in existing
  [normalize('Ugetsu Monogatari'), 'tt0047524'],        // "Ugetsu" in existing
  [normalize('My Neighbour Totoro'), 'tt0096283'],      // "My Neighbor Totoro" in existing
  [normalize("L'avventura"), 'tt0053619'],              // case diff
  [normalize('Hiroshima mon amour'), 'tt0052893'],      // case diff
  [normalize('La Grande Illusion'), 'tt0028950'],       // "Grand Illusion" in existing
  [normalize('GoodFellas'), 'tt0099685'],               // "Goodfellas" in existing
  [normalize('Close-up'), 'tt0099348'],                 // "Close-Up" in existing
  [normalize('Jeanne Dielman, 23 Quai du Commerce, 1080 Bruxelles'), 'tt0072961'],
  [normalize('Sunrise A Song of Two Humans'), 'tt0018455'],
  [normalize('L\'Argent'), 'tt0085035'],
  [normalize('Sans soleil'), 'tt0085408'],

  // Films not in existing sight-and-sound.json or movies.json
  [normalize("Cléo from 5 to 7"), 'tt0055852'],
  [normalize("Playtime"), 'tt0062936'],
  [normalize("The Night of the Hunter"), 'tt0048254'],
  [normalize("Daisies"), 'tt0060995'],
  [normalize("La Jetée"), 'tt0056119'],                 // exists in existing but verify
  [normalize("Wanda"), 'tt0067276'],
  [normalize("The Piano"), 'tt0107425'],
  [normalize("News from Home"), 'tt0074994'],
  [normalize("Fear Eats the Soul"), 'tt0071511'],
  [normalize("Le Mépris"), 'tt0057345'],
  [normalize("Battleship Potemkin"), 'tt0015648'],
  [normalize("Daughters of the Dust"), 'tt0101700'],
  [normalize("The Third Man"), 'tt0041959'],
  [normalize("The Red Shoes"), 'tt0040725'],
  [normalize("Metropolis"), 'tt0017136'],
  [normalize("The Gleaners and I"), 'tt0244750'],
  [normalize("Imitation of Life"), 'tt0052847'],
  [normalize("Histoire(s) du Cinéma"), 'tt0240525'],
  [normalize("Sunset Blvd."), 'tt0043014'],
  [normalize("Céline and Julie Go Boating"), 'tt0071115'],
  [normalize("Blue Velvet"), 'tt0090756'],
  [normalize("The Leopard"), 'tt0057091'],
  [normalize("Madame de..."), 'tt0046154'],
  [normalize("A Man Escaped"), 'tt0049902'],
  [normalize("The General"), 'tt0016619'],
  [normalize("Black Girl"), 'tt0059800'],
  [normalize("Get Out"), 'tt5052448'],
  [normalize("Vagabond"), 'tt0090168'],
  [normalize("The House Is Black"), 'tt0054729'],
  [normalize("Rio Bravo"), 'tt0053221'],
  [normalize("Come and See"), 'tt0091251'],
  [normalize("La Maman et la Putain"), 'tt0070432'],
  [normalize("Jaws"), 'tt0073195'],
  [normalize("Bringing Up Baby"), 'tt0029947'],
  [normalize("The Man Who Shot Liberty Valance"), 'tt0056217'],
  [normalize("Touch of Evil"), 'tt0052311'],
  [normalize("The Wizard of Oz"), 'tt0032138'],
  [normalize("Goodbye, Dragon Inn"), 'tt0370310'],
  [normalize("Don't Look Now"), 'tt0069995'],
  [normalize("A Woman under the Influence"), 'tt0072289'],
  [normalize("To Be or Not to Be"), 'tt0035446'],
  [normalize("The Thing"), 'tt0084787'],
  [normalize("The Texas Chain Saw Massacre"), 'tt0072271'],
  [normalize("The Conformist"), 'tt0065571'],
  [normalize("Aguirre, Wrath of God"), 'tt0068182'],
  [normalize("Only Angels Have Wings"), 'tt0031762'],
  [normalize("The Umbrellas of Cherbourg"), 'tt0058450'],
  [normalize("Johnny Guitar"), 'tt0047136'],
  [normalize("The Matrix"), 'tt0133093'],
  [normalize("The Ascent"), 'tt0074019'],
  [normalize("Raging Bull"), 'tt0081398'],
  [normalize("His Girl Friday"), 'tt0032599'],
  [normalize("Fanny and Alexander"), 'tt0083922'],
  [normalize("It's a Wonderful Life"), 'tt0038650'],
  [normalize("Notorious"), 'tt0038963'],
  [normalize("Lawrence of Arabia"), 'tt0056172'],
  [normalize("Gertrud"), 'tt0058054'],
  [normalize("All That Heaven Allows"), 'tt0047558'],
  [normalize("Partie de campagne"), 'tt0027648'],
  [normalize("Pickpocket"), 'tt0053168'],
  [normalize("Trouble in Paradise"), 'tt0023501'],
  [normalize("Sambizanga"), 'tt0069018'],
  [normalize("The Wild Bunch"), 'tt0065214'],
  [normalize("Les Enfants du paradis"), 'tt0037674'],
  [normalize("La ciénaga"), 'tt0258145'],
  [normalize("India Song"), 'tt0073133'],
  [normalize("Alien"), 'tt0078748'],
  [normalize("Vampyr"), 'tt0023673'],
  [normalize("The Watermelon Woman"), 'tt0118048'],
  [normalize("Le Bonheur"), 'tt0058964'],
  [normalize("Meghe Dhaka Tara"), 'tt0054092'],
  [normalize("West Indies: The Fugitive Slaves of Liberty"), 'tt0108898'],
  [normalize("Twin Peaks: The Return"), 'tt4093826'],
  [normalize("Los olvidados"), 'tt0042501'],
  [normalize("Out of the Past"), 'tt0039536'],
  [normalize("Vivre sa vie"), 'tt0056663'],
  [normalize("Amarcord"), 'tt0071129'],
  [normalize("Once upon a Time in America"), 'tt0087843'],
  [normalize("The Gospel According to St. Matthew"), 'tt0058715'],
  [normalize("Where Is the Friend's House?"), 'tt0093349'],
  [normalize("All about My Mother"), 'tt0185125'],
  [normalize("A City of Sadness"), 'tt0097754'],
  [normalize("Orlando"), 'tt0105011'],
  [normalize("West of the Tracks"), 'tt0361003'],
  [normalize("The Magnificent Ambersons"), 'tt0035015'],
  [normalize("Letter from an Unknown Woman"), 'tt0040524'],
  [normalize("Charulata"), 'tt0058155'],
  [normalize("The Good, the Bad and the Ugly"), 'tt0060196'],
  [normalize("Red Desert"), 'tt0058249'],
  [normalize("Black Narcissus"), 'tt0039424'],
  [normalize("Memories of Underdevelopment"), 'tt0063276'],
  [normalize("The Exterminating Angel"), 'tt0056574'],
  [normalize("Under the Skin"), 'tt1441395'],
  [normalize("Heat"), 'tt0113277'],
  [normalize("Symbiopsychotaxiplasm: Take One"), 'tt0095339'],
  [normalize("Out 1"), 'tt0109525'],
  [normalize("Un chien andalou"), 'tt0020530'],
  [normalize("Last Year at Marienbad"), 'tt0054632'],
  [normalize("Paris, Texas"), 'tt0087884'],
  [normalize("Les Demoiselles de Rochefort"), 'tt0062267'],
  [normalize("The Birds"), 'tt0056869'],
  [normalize("The River"), 'tt0043836'],
  [normalize("An Autumn Afternoon"), 'tt0055949'],
  [normalize("Love Streams"), 'tt0087715'],
  [normalize("Greed"), 'tt0014190'],
  [normalize("Pyaasa"), 'tt0050844'],
  [normalize("Wings of Desire"), 'tt0093761'],
  [normalize("Magnolia"), 'tt0175880'],
  [normalize("The Life and Death of Colonel Blimp"), 'tt0036112'],
  [normalize("Wavelength"), 'tt0062546'],
  [normalize("I Know Where I'm Going!"), 'tt0037800'],
  [normalize("L' eclisse"), 'tt0055998'],
  [normalize("One Way or Another"), 'tt0073131'],
  [normalize("Nosferatu"), 'tt0013442'],
  [normalize("Paisan"), 'tt0038823'],
  [normalize("Zama"), 'tt5718986'],
  [normalize("Mad Max: Fury Road"), 'tt1392190'],
  [normalize("The Tree of Life"), 'tt0478304'],
  [normalize("Uncle Boonmee Who Can Recall His Past Lives"), 'tt1341188'],
  [normalize("The Headless Woman"), 'tt1201737'],
  [normalize("Paris Is Burning"), 'tt0100168'],
  [normalize("By the Bluest of Seas"), 'tt0026374'],
  [normalize("Duck Soup"), 'tt0023969'],
  [normalize("All about Eve"), 'tt0042192'],
  [normalize("Brief Encounter"), 'tt0037558'],
  [normalize("Suspiria"), 'tt0076786'],
  [normalize("In a Lonely Place"), 'tt0042541'],
  [normalize("Melancholia"), 'tt1535109'],
  [normalize("Twenty Years Later"), 'tt0088353'],
  [normalize("Twin Peaks: Fire Walk with Me"), 'tt0105665'],
  [normalize("Pink Flamingos"), 'tt0069089'],
  [normalize("Limite"), 'tt0022021'],
  [normalize("Harlan County, USA"), 'tt0074514'],
  [normalize("Cries and Whispers"), 'tt0069687'],
  [normalize("Star Wars"), 'tt0076759'],
  [normalize("Intolerance"), 'tt0006864'],
  [normalize("The Hour of the Furnaces"), 'tt0063045'],
  [normalize("Europa '51"), 'tt0044551'],
  [normalize("Napoléon"), 'tt0018142'],
  [normalize("The Crowd"), 'tt0018806'],
  [normalize("A Touch of Zen"), 'tt0065554'],
  [normalize("Je, tu, il, elle"), 'tt0072129'],
  [normalize("Petite maman"), 'tt12540014'],
  [normalize("As I Was Moving Ahead, Occasionally I Saw Brief Glimpses of Beauty"), 'tt0252843'],
  [normalize("Flowers of Shanghai"), 'tt0155030'],
  [normalize("Happy Together"), 'tt0118845'],
  [normalize("Crash"), 'tt0115964'],
  [normalize("Blue"), 'tt0106950'],
  [normalize("Grave of the Fireflies"), 'tt0095327'],
  [normalize("The Green Ray"), 'tt0091286'],
  [normalize("Born in Flames"), 'tt0085354'],
  [normalize("Pandora's Box"), 'tt0019647'],
  [normalize("Sullivan's Travels"), 'tt0034572'],
  [normalize("Annie Hall"), 'tt0075686'],
  [normalize("Earth"), 'tt0020856'],
  [normalize("My Darling Clementine"), 'tt0038858'],
  [normalize("Mouchette"), 'tt0061903'],
  [normalize("A Canterbury Tale"), 'tt0036747'],
  [normalize("Videodrome"), 'tt0086541'],
  [normalize("Possession"), 'tt0082782'],
  [normalize("Soleil Ô"), 'tt0068168'],
  [normalize("Distant Voices, Still Lives"), 'tt0094989'],
  [normalize("Nostalgia for the Light"), 'tt1556592'],
  [normalize("Syndromes and a Century"), 'tt0477707'],
  [normalize("The Intruder"), 'tt0391059'],
  [normalize("Morvern Callar"), 'tt0250264'],
  [normalize("In Vanda's Room"), 'tt0243947'],
  [normalize("Werckmeister Harmonies"), 'tt0249241'],
  [normalize("Taste of Cherry"), 'tt0118817'],
  [normalize("The Quince Tree Sun"), 'tt0103939'],
  [normalize("The Last Laugh"), 'tt0015063'],
  [normalize("The Apartment"), 'tt0053604'],
  [normalize("Sherlock Jr."), 'tt0015324'],
]);

const result = raw.map(entry => {
  const year = parseInt(entry.yearLocation.slice(0, 4));
  const rank = parseInt(entry.rank.replace('=', ''));
  const title = entry.title;
  const normTitle = normalize(title);

  const imdbId = lookupByTitle.get(normTitle)
    || hardcodedByNormTitle.get(normTitle)
    || null;

  if (!imdbId) {
    process.stderr.write(`WARNING: No imdbId found for "${title}" (${year}, rank ${rank})\n`);
  }

  return { imdbId, title, year, rank };
});

// Sort by rank ascending, then title alphabetically for ties
result.sort((a, b) => a.rank !== b.rank ? a.rank - b.rank : a.title.localeCompare(b.title));

console.log(JSON.stringify(result, null, 2));
