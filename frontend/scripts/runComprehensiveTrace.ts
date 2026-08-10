import fs from 'fs';
import path from 'path';

// 1. Read production dataset dump
const dumpPath = path.join(__dirname, '../src/constants/templeDataDump.json');
const templeDump: Array<any> = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));

// 2. Read travel data content to extract EXPLORE_NEARBY_DATA keys & aliases
const travelDataContent = fs.readFileSync(
  path.join(__dirname, '../src/data/jyotirlingaTravelData.ts'),
  'utf-8'
);

const aliasMatches = travelDataContent.match(/TEMPLE_KEY_ALIASES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\};/);
const explicitAliases: Record<string, string> = {};
if (aliasMatches) {
  for (const line of aliasMatches[1].split('\n')) {
    const m = line.match(/'([^']+)'\s*:\s*'([^']+)'/);
    if (m) explicitAliases[m[1]] = m[2];
  }
}

const curatedMatches = travelDataContent.match(/EXPLORE_NEARBY_DATA:\s*Record<[\s\S]*?=\s*\{([\s\S]*?)\n\};/);
const curatedKeys = new Set<string>();
if (curatedMatches) {
  for (const line of curatedMatches[1].split('\n')) {
    const m = line.match(/^\s*['"]?([a-z0-9-]+)['"]?\s*:\s*\{/);
    if (m) curatedKeys.add(m[1]);
  }
}

function normalizeTempleKey(rawInput: string): string {
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

const testTargets = [
  'Somnath Temple',
  'Annapoorneshwari Temple – Horanadu',
  'Ambalappuzha Sri Krishna Temple – Alappuzha',
  'Sri Aurobindo Ashram – Puducherry',
  'Kamakhya',
  'Vaitheeswaran Koil'
];

console.log('===========================================================');
console.log('STEP 1 & 7 — END-TO-END TRACE FOR SPECIFIC TEST TARGETS');
console.log('===========================================================');

for (const targetName of testTargets) {
  const temple = templeDump.find(t => 
    t.name?.toLowerCase().includes(targetName.toLowerCase().split('–')[0].trim()) ||
    t.temple_id?.toLowerCase().includes(targetName.toLowerCase().split('–')[0].trim())
  );

  console.log(`\n-----------------------------------------------------------`);
  console.log(`TARGET: "${targetName}"`);
  if (!temple) {
    console.log(`⚠️ RECORD NOT FOUND IN TEMPLE DUMP`);
    continue;
  }

  // STEP 1 TRACE LOGS
  const rawRouteId = temple.id;
  const loadedTempleId = temple.id;
  const loadedTempleName = temple.name;
  const category = temple.category;
  const city = temple.location?.city || temple.location?.area || '';
  const district = temple.location?.area || '';
  const state = temple.location?.state || '';
  const latitude = temple.coords?.latitude;
  const longitude = temple.coords?.longitude;

  console.log('[NEARBY RUNTIME INPUT]', {
    rawRouteId,
    loadedTempleId,
    loadedTempleName,
    category,
    city,
    district,
    state,
    latitude,
    longitude
  });

  const idNorm = loadedTempleId ? normalizeTempleKey(loadedTempleId) : '';
  const nameNorm = loadedTempleName ? normalizeTempleKey(loadedTempleName) : '';
  const matchedKey = (idNorm && curatedKeys.has(idNorm)) ? idNorm : ((nameNorm && curatedKeys.has(nameNorm)) ? nameNorm : (idNorm || nameNorm));

  console.log('[NEARBY CANONICAL RESULT]', {
    candidates: { idNorm, nameNorm },
    normalizedKey: matchedKey,
    matchedKey,
    source: curatedKeys.has(matchedKey) ? (curatedKeys.has(idNorm) ? 'id' : 'name') : 'none'
  });

  const exploreDataExists = curatedKeys.has(matchedKey);
  console.log('[NEARBY DATA LOOKUP]', {
    matchedKey,
    exploreDataExists,
    sacredPlacesCount: exploreDataExists ? 'curated' : 0,
    nearbyTemplesCount: exploreDataExists ? 'curated' : 0,
    coordsExists: !!(latitude && longitude)
  });

  const hasCuratedData = exploreDataExists;
  console.log('[NEARBY FINAL RESULT]', {
    hasCuratedData,
    sacredPlacesCount: exploreDataExists ? 'curated' : 0,
    nearbyTemplesCount: exploreDataExists ? 'curated' : 0
  });

  console.log('[NEARBY UI RENDER]', {
    hasCuratedData,
    sacredPlacesCount: exploreDataExists ? 'curated' : 0,
    nearbyTemplesCount: exploreDataExists ? 'curated' : 0,
    shouldRenderSection: hasCuratedData // CURRENT UI BEHAVIOR CHECK
  });
}

console.log('\n===========================================================');
console.log('STEP 5 — AUDIT ALL 409 PHYSICAL ENTITIES IN PRODUCTION DUMP');
console.log('===========================================================');

let countA_curatedData = 0;
let countB_coordsAvailable = 0;
let countC_nearbyFallbackPossible = 0;
let countD_noNearbyData = 0;
let countE_resolverFailure = 0;
let countF_missingIdentity = 0;
let countG_missingCoords = 0;

for (const t of templeDump) {
  if (!t.id && !t.name) {
    countF_missingIdentity++;
    continue;
  }

  const idNorm = t.id ? normalizeTempleKey(t.id) : '';
  const nameNorm = t.name ? normalizeTempleKey(t.name) : '';
  const matchedKey = (idNorm && curatedKeys.has(idNorm)) ? idNorm : ((nameNorm && curatedKeys.has(nameNorm)) ? nameNorm : (idNorm || nameNorm));

  const hasCurated = curatedKeys.has(matchedKey);
  const hasCoords = !!(t.coords?.latitude && t.coords?.longitude);

  if (hasCurated) {
    countA_curatedData++;
  }
  
  if (hasCoords) {
    countB_coordsAvailable++;
  } else {
    countG_missingCoords++;
  }

  if (!hasCurated && hasCoords) {
    countC_nearbyFallbackPossible++;
  }

  if (!hasCurated && !hasCoords) {
    countD_noNearbyData++;
  }
}

console.log(`TOTAL PRODUCTION DUMP RECORDS: ${templeDump.length}`);
console.log(`A. Curated Nearby Data       : ${countA_curatedData}`);
console.log(`B. Coordinates Available     : ${countB_coordsAvailable}`);
console.log(`C. Nearby Fallback Possible   : ${countC_nearbyFallbackPossible}`);
console.log(`D. No Nearby Data (No Curated + No Coords): ${countD_noNearbyData}`);
console.log(`E. Resolver Failure          : ${countE_resolverFailure}`);
console.log(`F. Missing Identity          : ${countF_missingIdentity}`);
console.log(`G. Missing Coordinates       : ${countG_missingCoords}`);
console.log('===========================================================\n');
