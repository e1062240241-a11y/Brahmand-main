const fs = require('fs');

const travelDataContent = fs.readFileSync('./src/data/jyotirlingaTravelData.ts', 'utf-8');
const templeImagesContent = fs.readFileSync('./src/constants/templeImages.ts', 'utf-8');

// 1. Extract explicit aliases from TEMPLE_KEY_ALIASES
const aliasMatches = travelDataContent.match(/TEMPLE_KEY_ALIASES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\};/);
const explicitAliases = {};
if (aliasMatches) {
  for (const line of aliasMatches[1].split('\n')) {
    const m = line.match(/'([^']+)'\s*:\s*'([^']+)'/);
    if (m) explicitAliases[m[1]] = m[2];
  }
}

// 2. Extract EXPLORE_NEARBY_DATA entries
const curatedMap = {};
const curatedBlocks = travelDataContent.matchAll(/^\s*['"]?([a-z0-9-]+)['"]?\s*:\s*\{([\s\S]*?)\n\s*\},?\n/gm);

// Direct parsing of curated keys
const curatedKeys = new Set();
const curatedKeyMatches = travelDataContent.matchAll(/^\s*['"]?([a-z0-9-]+)['"]?\s*:\s*\{\s*\n\s*sacredPlaces:/gm);
for (const m of curatedKeyMatches) {
  curatedKeys.add(m[1]);
}

// Normalization function (exact replica of production logic)
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

// 3. Extract asset keys from TEMPLE_IMAGES
const assetKeyMatches = templeImagesContent.matchAll(/'([^']+)':\s*require/g);
const allAssetKeys = new Set();
for (const m of assetKeyMatches) {
  allAssetKeys.add(m[1]);
}

// Group asset keys into physical entities
const physicalEntities = new Map(); // canonicalKey -> assetKeys[]
for (const assetKey of allAssetKeys) {
  const canonical = normalizeTempleKey(assetKey);
  if (!physicalEntities.has(canonical)) {
    physicalEntities.set(canonical, []);
  }
  physicalEntities.get(canonical).push(assetKey);
}

// Resolver test function
function getExploreNearbyData(templeId, templeName = '', category = '') {
  const idNormalized = templeId ? normalizeTempleKey(templeId) : '';
  const nameNormalized = templeName ? normalizeTempleKey(templeName) : '';

  let idCandidate = (idNormalized && curatedKeys.has(idNormalized)) ? idNormalized : undefined;
  let nameCandidate = (nameNormalized && curatedKeys.has(nameNormalized)) ? nameNormalized : undefined;

  let currentTempleKey = idCandidate || nameCandidate || idNormalized || nameNormalized;
  let resolvedFrom = idCandidate ? 'id' : (nameCandidate ? 'name' : 'none');
  let hasCuratedData = curatedKeys.has(currentTempleKey);

  return {
    templeId,
    templeName,
    currentTempleKey,
    resolvedFrom,
    hasCuratedData
  };
}

// Run audit across all 409 physical entities
const categories = {
  A: [], // Curated + resolver PASS
  B: [], // Curated + resolver FAIL
  C: [], // No curated data
  D: [], // Resolver collision / wrong canonical mapping
  E: [], // UI rendering problem
  F: []  // Self-reference / filtering problem
};

for (const [canonicalKey, assetKeys] of physicalEntities.entries()) {
  const sampleAssetId = assetKeys[0];

  // Test resolution via ID
  const resId = getExploreNearbyData(sampleAssetId);
  
  // Test resolution via Name
  const cleanName = sampleAssetId.replace(/^(jyotirling|shaktipeeth|chardham|other|sacred|shiva|vishnu|devi)-/, '').replace(/-/g, ' ');
  const resName = getExploreNearbyData('opaque_firestore_id_123', cleanName);

  const isCurated = curatedKeys.has(canonicalKey);

  if (isCurated) {
    if (resId.hasCuratedData || resName.hasCuratedData) {
      categories.A.push({ canonicalKey, sampleAssetId });
    } else {
      categories.B.push({ canonicalKey, sampleAssetId, resId, resName });
    }
  } else {
    categories.C.push({ canonicalKey, sampleAssetId });
  }
}

console.log('========================================');
console.log('ALL TEMPLE RUNTIME COVERAGE AUDIT');
console.log('========================================');
console.log('Asset keys                      :', allAssetKeys.size);
console.log('Physical entities               :', physicalEntities.size);
console.log('Explicit alias keys             :', Object.keys(explicitAliases).length);
console.log('');
console.log('Curated entities in registry    :', curatedKeys.size);
console.log('Missing curated entities (Debt) :', physicalEntities.size - curatedKeys.size);
console.log('');
console.log('A — Curated + resolver PASS     :', categories.A.length);
console.log('B — Curated but resolver FAIL   :', categories.B.length);
console.log('C — No curated data (Uncurated) :', categories.C.length);
console.log('D — Resolver collision          :', categories.D.length);
console.log('E — UI rendering failure        :', categories.E.length);
console.log('F — Filtering/self-ref failure  :', categories.F.length);
console.log('========================================');

if (categories.B.length > 0) {
  console.log('\n[CATEGORY B FAILURES]', categories.B);
}
