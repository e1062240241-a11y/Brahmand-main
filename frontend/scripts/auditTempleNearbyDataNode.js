/**
 * auditTempleNearbyDataNode.js
 */
const fs = require('fs');
const path = require('path');

const travelDataContent = fs.readFileSync(
  path.join(__dirname, '../src/data/jyotirlingaTravelData.ts'),
  'utf-8'
);

const imagesContent = fs.readFileSync(
  path.join(__dirname, '../src/constants/templeImages.ts'),
  'utf-8'
);

// Extract alias keys
const aliasMatches = travelDataContent.match(/TEMPLE_KEY_ALIASES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\};/);
const aliases = {};
if (aliasMatches) {
  const aliasLines = aliasMatches[1].split('\n');
  for (const line of aliasLines) {
    const m = line.match(/'([^']+)'\s*:\s*'([^']+)'/);
    if (m) {
      aliases[m[1]] = m[2];
    }
  }
}

// Extract curated keys
const curatedMatches = travelDataContent.match(/EXPLORE_NEARBY_DATA:\s*Record<[\s\S]*?=\s*\{([\s\S]*?)\n\};/);
const curatedKeys = new Set();
if (curatedMatches) {
  const curatedLines = curatedMatches[1].split('\n');
  for (const line of curatedLines) {
    const m = line.match(/^\s*['"]?([a-z0-9-]+)['"]?\s*:\s*\{/);
    if (m) {
      curatedKeys.add(m[1]);
    }
  }
}

// Extract all registered temple IDs from templeImages.ts
const registeredIds = [];
const imageLines = imagesContent.split('\n');
for (const line of imageLines) {
  const m = line.match(/^\s*'([^']+)'\s*:/);
  if (m) {
    registeredIds.push(m[1]);
  }
}

// Normalization function (mirroring TypeScript implementation)
function normalizeTempleKey(rawInput) {
  if (!rawInput) return '';
  const lower = String(rawInput).toLowerCase().trim();

  if (aliases[lower]) {
    return aliases[lower];
  }

  const cleanedInput = lower.replace(/[^a-z0-9]/g, '');

  for (const [alias, canonical] of Object.entries(aliases)) {
    const cleanedAlias = alias.replace(/[^a-z0-9]/g, '');
    if (cleanedInput === cleanedAlias) {
      return canonical;
    }
  }

  const coreKeywords = [
    { kw: 'kedarnath', canonical: 'kedarnath' },
    { kw: 'badrinath', canonical: 'badrinath' },
    { kw: 'somnath', canonical: 'somnath' },
    { kw: 'dwarkadhish', canonical: 'dwarkadhish' },
    { kw: 'dwarka', canonical: 'dwarkadhish' },
    { kw: 'puri', canonical: 'jagannath-puri' },
    { kw: 'jagannath', canonical: 'jagannath-puri' },
    { kw: 'mahakal', canonical: 'mahakaleshwar' },
    { kw: 'mahakaleshwar', canonical: 'mahakaleshwar' },
    { kw: 'kashi', canonical: 'kashi-vishwanath' },
    { kw: 'vishwanath', canonical: 'kashi-vishwanath' },
    { kw: 'baidyanath', canonical: 'baidyanath' },
    { kw: 'deoghar', canonical: 'baidyanath' },
    { kw: 'grishneshwar', canonical: 'grishneshwar' },
    { kw: 'ellora', canonical: 'grishneshwar' },
    { kw: 'omkareshwar', canonical: 'omkareshwar' },
    { kw: 'bhimashankar', canonical: 'bhimashankar' },
    { kw: 'trimbakeshwar', canonical: 'trimbakeshwar' },
    { kw: 'nageshwar', canonical: 'nageshwar' },
    { kw: 'ramanathaswamy', canonical: 'ramanathaswamy' },
    { kw: 'rameswaram', canonical: 'ramanathaswamy' },
    { kw: 'srisailam', canonical: 'srisailam' },
    { kw: 'mallikarjuna', canonical: 'srisailam' },
    { kw: 'tanot', canonical: 'tanot-mata' },
  ];

  for (const item of coreKeywords) {
    if (cleanedInput.includes(item.kw)) {
      return item.canonical;
    }
  }

  return lower;
}

// Run audit
const canonicalMap = {};
const coveredList = [];
const missingList = [];
const collisions = {};

for (const id of registeredIds) {
  const canonical = normalizeTempleKey(id);
  if (!canonicalMap[canonical]) {
    canonicalMap[canonical] = [];
  }
  canonicalMap[canonical].push(id);
}

for (const [key, ids] of Object.entries(canonicalMap)) {
  const uniqueBases = new Set(ids.map(id => id.replace(/^[a-z]+-/, '')));
  if (uniqueBases.size > 1) {
    collisions[key] = ids;
  }
}

const uniqueCanonicals = Object.keys(canonicalMap);

for (const canonical of uniqueCanonicals) {
  const sampleId = canonicalMap[canonical][0];
  if (curatedKeys.has(canonical)) {
    coveredList.push({ canonical, sampleId });
  } else {
    missingList.push({ canonical, sampleId });
  }
}

console.log('========================================');
console.log('ALL-TEMPLE NEARBY DATA AUDIT');
console.log('========================================');
console.log(`Total Registered Temple IDs : ${registeredIds.length}`);
console.log(`Total Unique Canonical Keys  : ${uniqueCanonicals.length}`);
console.log(`Curated Keys Available      : ${curatedKeys.size}`);
console.log(`Canonicals Covered          : ${coveredList.length}`);
console.log(`Canonicals Missing Data     : ${missingList.length}`);
console.log(`Normalization Collisions    : ${Object.keys(collisions).length}`);
console.log('========================================\n');

console.log('--- COVERED CANONICAL TEMPLES ---');
coveredList.forEach(c => console.log(`✓ ${c.canonical} (sample ID: ${c.sampleId})`));

console.log('\n--- MISSING CANONICAL TEMPLES (hasCuratedData: false) ---');
missingList.forEach((m, idx) => console.log(`${idx + 1}. Canonical: "${m.canonical}" | Sample ID: "${m.sampleId}"`));

if (Object.keys(collisions).length > 0) {
  console.log('\n--- NORMALIZATION COLLISIONS ---');
  for (const [key, ids] of Object.entries(collisions)) {
    console.log(`\n[COLLISION KEY: ${key}]`);
    ids.forEach(id => console.log(`  - ${id}`));
  }
}
