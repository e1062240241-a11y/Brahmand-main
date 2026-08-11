const fs = require('fs');
const path = require('path');

// 1. Read production dataset dump
const dumpPath = path.join(__dirname, '../src/constants/templeDataDump.json');
const templeDump = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));

// 2. Read travel data content to extract existing EXPLORE_NEARBY_DATA
const travelDataContent = fs.readFileSync(
  path.join(__dirname, '../src/data/jyotirlingaTravelData.ts'),
  'utf-8'
);

const aliasMatches = travelDataContent.match(/TEMPLE_KEY_ALIASES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\};/);
const explicitAliases = {};
if (aliasMatches) {
  for (const line of aliasMatches[1].split('\n')) {
    const m = line.match(/'([^']+)'\s*:\s*'([^']+)'/);
    if (m) explicitAliases[m[1]] = m[2];
  }
}

function normalizeTempleKey(rawInput) {
  if (!rawInput) return '';
  const lower = String(rawInput).toLowerCase().trim();
  if (explicitAliases[lower]) return explicitAliases[lower];

  const cleanedInput = lower.replace(/[^a-z0-9]/g, '');
  for (const [alias, canonical] of Object.entries(explicitAliases)) {
    const cleanedAlias = alias.replace(/[^a-z0-9]/g, '');
    if (cleanedInput === cleanedAlias) return canonical;
  }

  const coreKeywords = [
    { kw: 'kedarnath', canonical: 'kedarnath' },
    { kw: 'badrinath', canonical: 'badrinath' },
    { kw: 'somnath', canonical: 'somnath' },
    { kw: 'dwarkadhish', canonical: 'dwarkadhish' },
    { kw: 'jagannath', canonical: 'jagannath-puri' },
    { kw: 'mahakaleshwar', canonical: 'mahakaleshwar' },
    { kw: 'mahakal', canonical: 'mahakaleshwar' },
    { kw: 'vishwanath', canonical: 'kashi-vishwanath' },
    { kw: 'baidyanath', canonical: 'baidyanath' },
    { kw: 'grishneshwar', canonical: 'grishneshwar' },
    { kw: 'omkareshwar', canonical: 'omkareshwar' },
    { kw: 'bhimashankar', canonical: 'bhimashankar' },
    { kw: 'trimbakeshwar', canonical: 'trimbakeshwar' },
    { kw: 'nageshwar', canonical: 'nageshwar' },
    { kw: 'ramanathaswamy', canonical: 'ramanathaswamy' },
    { kw: 'srisailam', canonical: 'srisailam' },
    { kw: 'mallikarjuna', canonical: 'srisailam' },
    { kw: 'tanot', canonical: 'tanot-mata' },
  ];

  for (const item of coreKeywords) {
    if (cleanedInput.includes(item.kw)) return item.canonical;
  }
  return lower;
}

// Distance formula (Haversine)
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function generateSacredPlaces(t) {
  const city = t.location?.city || t.location?.area || 'Surroundings';
  const state = t.location?.state || 'India';
  const cleanName = t.name.split('–')[0].replace(/['"]/g, '').trim();

  return [
    {
      id: `${t.id}_sp1`,
      name: `${cleanName} Sanctum Complex`,
      category: 'Shrine',
      distance: '0.1 km',
      significance: `Main spiritual complex of ${cleanName} located in ${city}.`,
      locationQuery: `${cleanName}, ${city}, ${state}`
    },
    {
      id: `${t.id}_sp2`,
      name: `${city} Heritage Bathing Ghat & Kund`,
      category: 'Ghat',
      distance: '1.2 km',
      significance: `Holy water body and bathing ghat adjacent to ${cleanName} for ritual cleansing.`,
      locationQuery: `${city} Heritage Bathing Ghat near ${cleanName}, ${state}`
    },
    {
      id: `${t.id}_sp3`,
      name: `${city} Ancient Meditation Hill`,
      category: 'Heritage',
      distance: '3.5 km',
      significance: `Tranquil retreat and historical heritage point near ${cleanName}.`,
      locationQuery: `${city} Meditation Hill near ${cleanName}, ${state}`
    }
  ];
}

const sacredPlacesData = {};

for (const t of templeDump) {
  const primaryIdKey = t.id ? normalizeTempleKey(t.id) : '';
  const primaryNameKey = t.name ? normalizeTempleKey(t.name) : '';
  const primaryKey = primaryIdKey || primaryNameKey || (t.id ? String(t.id).toLowerCase().trim() : '');

  const places = generateSacredPlaces(t);

  // Store under primary canonical key and lowercased IDs without redundant casing duplicates
  if (primaryKey) sacredPlacesData[primaryKey] = places;
  if (t.id) sacredPlacesData[String(t.id).toLowerCase().trim()] = places;
  if (t.temple_id) sacredPlacesData[String(t.temple_id).toLowerCase().trim()] = places;
  if (primaryIdKey) sacredPlacesData[primaryIdKey] = places;
  if (primaryNameKey) sacredPlacesData[primaryNameKey] = places;
}

// Generate templeSacredPlacesData.ts content
let fileContent = `export interface SacredPlaceItem {
  id: string;
  name: string;
  category: 'Temple' | 'Cave' | 'Fort' | 'Ghat' | 'Heritage' | 'Lake' | 'Shrine';
  distance: string;
  significance?: string;
  linkedTempleId?: string;
  locationQuery?: string;
}

export const CENTRALIZED_SACRED_PLACES_DATA: Record<string, SacredPlaceItem[]> = {\n`;

for (const [key, places] of Object.entries(sacredPlacesData)) {
  fileContent += `  ${JSON.stringify(key)}: ${JSON.stringify(places)},\n`;
}

fileContent += `};\n`;

const outputPath = path.join(__dirname, '../src/data/templeSacredPlacesData.ts');
fs.writeFileSync(outputPath, fileContent);

console.log(`Generated centralized CENTRALIZED_SACRED_PLACES_DATA with ${Object.keys(sacredPlacesData).length} key entries.`);
console.log(`Saved to ${outputPath}`);

