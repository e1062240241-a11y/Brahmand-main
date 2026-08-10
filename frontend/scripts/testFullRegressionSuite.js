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

// Extract EXPLORE_NEARBY_DATA
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

const testSuite = [
  { desc: '1. Mallikarjuna Srisailam with opaque Firestore ID', id: '03abHQEE4Jiqtw68lqtu', name: 'Mallikarjuna Srisailam Temple' },
  { desc: '2. Srisailam with canonical ID', id: 'srisailam', name: 'Mallikarjuna Swamy Temple' },
  { desc: '3. Kedarnath', id: 'jyotirling-kedarnath-temple-uttarakhand', name: 'Kedarnath Temple' },
  { desc: '4. Badrinath', id: 'chardham-badrinath-temple-uttarakhand', name: 'Badrinath Temple' },
  { desc: '5. Golden Temple', id: 'other-golden-temple-amritsar', name: 'Golden Temple Amritsar' },
  { desc: '6. Batch 2 temple (Naina Devi Bilaspur)', id: 'shaktipeeth-naina-devi-temple-bilaspur', name: 'Naina Devi Temple' },
  { desc: '7. Uncurated temple', id: 'uncurated_dummy_id_99', name: 'Random Uncurated Shrine' }
];

console.log('=== FULL REGRESSION TEST SUITE ===');

for (const t of testSuite) {
  const idNormalized = t.id ? normalizeTempleKey(t.id) : '';
  const nameNormalized = t.name ? normalizeTempleKey(t.name) : '';

  let idCandidate = (idNormalized && curatedKeys.has(idNormalized)) ? idNormalized : undefined;
  let nameCandidate = (nameNormalized && curatedKeys.has(nameNormalized)) ? nameNormalized : undefined;

  let currentTempleKey = idCandidate || nameCandidate || idNormalized || nameNormalized;
  let resolvedFrom = idCandidate ? 'id' : (nameCandidate ? 'name' : 'none');
  let hasCuratedData = curatedKeys.has(currentTempleKey);

  console.log('\n--- Test:', t.desc, '---');
  console.log({
    rawId: t.id,
    rawName: t.name,
    idCandidate: idCandidate || 'unresolved',
    nameCandidate: nameCandidate || 'unresolved',
    resolvedFrom,
    currentTempleKey,
    hasCuratedData
  });
}
