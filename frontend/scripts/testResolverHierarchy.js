const path = require('path');
const fs = require('fs');

const travelDataContent = fs.readFileSync('./src/data/jyotirlingaTravelData.ts', 'utf-8');

// Extract TEMPLE_KEY_ALIASES
const aliasMatches = travelDataContent.match(/TEMPLE_KEY_ALIASES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\};/);
const explicitAliases = {};
if (aliasMatches) {
  for (const line of aliasMatches[1].split('\n')) {
    const m = line.match(/'([^']+)'\s*:\s*'([^']+)'/);
    if (m) explicitAliases[m[1]] = m[2];
  }
}

// Extract EXPLORE_NEARBY_DATA keys
const curatedKeys = new Set();
const curatedMatches = travelDataContent.matchAll(/^\s*['"]?([a-z0-9-]+)['"]?\s*:\s*\{\s*\n\s*sacredPlaces:/gm);
for (const m of curatedMatches) {
  curatedKeys.add(m[1]);
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

function resolveExploreNearbyData(templeId, templeName) {
  const idNormalized = templeId ? normalizeTempleKey(templeId) : '';
  const nameNormalized = templeName ? normalizeTempleKey(templeName) : '';

  let idCandidate = undefined;
  if (idNormalized && curatedKeys.has(idNormalized)) {
    idCandidate = idNormalized;
  }

  let nameCandidate = undefined;
  if (nameNormalized && curatedKeys.has(nameNormalized)) {
    nameCandidate = nameNormalized;
  }

  let currentTempleKey = '';
  let resolvedFrom = 'none';

  if (idCandidate) {
    currentTempleKey = idCandidate;
    resolvedFrom = 'id';
  } else if (nameCandidate) {
    currentTempleKey = nameCandidate;
    resolvedFrom = 'name';
  } else if (idNormalized) {
    currentTempleKey = idNormalized;
  } else if (nameNormalized) {
    currentTempleKey = nameNormalized;
  }

  const hasCuratedData = curatedKeys.has(currentTempleKey);

  const diag = {
    rawId: templeId,
    rawName: templeName,
    idCandidate: idCandidate || 'unresolved',
    nameCandidate: nameCandidate || 'unresolved',
    resolvedFrom,
    currentTempleKey,
    hasCuratedData
  };

  console.log('[NEARBY RESOLUTION]', diag);
  return diag;
}

console.log('=== RUNNING COMPREHENSIVE REGRESSION TESTS ===');

const testCases = [
  { desc: '1. Opaque Firestore ID + Mallikarjuna Srisailam Temple', id: '03abHQEE4Jiqtw68lqtu', name: 'Mallikarjuna Srisailam Temple', expKey: 'srisailam', expFrom: 'name' },
  { desc: '2. Opaque Firestore ID + Kedarnath Temple', id: 'firestore_doc_999', name: 'Kedarnath Temple', expKey: 'kedarnath', expFrom: 'name' },
  { desc: '3. Known canonical ID + name', id: 'kedarnath', name: 'Kedarnath Temple', expKey: 'kedarnath', expFrom: 'id' },
  { desc: '4. Known alias ID + name', id: 'jyotirling-kedarnath-temple-uttarakhand', name: 'Kedarnath Temple', expKey: 'kedarnath', expFrom: 'id' },
  { desc: '5. Unknown ID + unknown name', id: 'random_id_x', name: 'Unknown Sacred Shrine', expKey: 'random_id_x', expFrom: 'none' }
];

let failed = 0;
for (const tc of testCases) {
  console.log('\n---', tc.desc, '---');
  const res = resolveExploreNearbyData(tc.id, tc.name);
  if (res.currentTempleKey !== tc.expKey || res.resolvedFrom !== tc.expFrom) {
    console.error('FAIL: Expected key:', tc.expKey, 'got:', res.currentTempleKey, '| Expected from:', tc.expFrom, 'got:', res.resolvedFrom);
    failed++;
  } else {
    console.log('PASS');
  }
}

if (failed === 0) {
  console.log('\nALL REGRESSION TESTS PASSED!');
} else {
  console.error('\nFAILED TESTS COUNT:', failed);
  process.exit(1);
}
