const fs = require('fs');
const path = require('path');

// Read production dataset dump
const dumpPath = path.join(__dirname, '../src/constants/templeDataDump.json');
const templeDump = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));

// Read travel data file
const travelDataContent = fs.readFileSync(
  path.join(__dirname, '../src/data/jyotirlingaTravelData.ts'),
  'utf-8'
);

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
const curatedMatches = travelDataContent.match(/EXPLORE_NEARBY_DATA:\s*Record<[\s\S]*?=\s*\{([\s\S]*?)\n\};/);
const curatedKeys = new Set();
if (curatedMatches) {
  for (const line of curatedMatches[1].split('\n')) {
    const m = line.match(/^\s*['"]?([a-z0-9-]+)['"]?\s*:\s*\{/);
    if (m) curatedKeys.add(m[1]);
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

console.log('===========================================================');
console.log('SACRED PLACES COVERAGE AUDIT — PRODUCTION TEMPLE INVENTORY');
console.log('===========================================================');
console.log(`Total Physical Entities in Dump: ${templeDump.length}`);

let curatedWithSacred = 0;
let uncuratedWithoutSacred = 0;
const missingTemples = [];
const curatedList = [];

for (const t of templeDump) {
  const idNorm = t.id ? normalizeTempleKey(t.id) : (t.temple_id ? normalizeTempleKey(t.temple_id) : '');
  const nameNorm = t.name ? normalizeTempleKey(t.name) : '';
  const matchedKey = (idNorm && curatedKeys.has(idNorm)) ? idNorm : ((nameNorm && curatedKeys.has(nameNorm)) ? nameNorm : (idNorm || nameNorm));

  const hasCurated = curatedKeys.has(matchedKey);
  if (hasCurated) {
    curatedWithSacred++;
    curatedList.push({ id: t.id || t.temple_id, name: t.name, matchedKey });
  } else {
    uncuratedWithoutSacred++;
    missingTemples.push({
      id: t.id || t.temple_id,
      name: t.name,
      category: t.category,
      city: t.location?.city || t.location?.area || '',
      state: t.location?.state || '',
      lat: t.coords?.latitude,
      lng: t.coords?.longitude
    });
  }
}

console.log(`Curated Sacred Places Entities   : ${curatedWithSacred}`);
console.log(`Uncurated / Missing Sacred Places : ${uncuratedWithoutSacred}`);
console.log('===========================================================\n');

console.log('Sample Uncurated Temples Needing Sacred Places (First 15):');
missingTemples.slice(0, 15).forEach((item, idx) => {
  console.log(`${idx + 1}. [${item.category}] ${item.name} (${item.city}, ${item.state}) [ID: ${item.id}]`);
});

// Save complete breakdown for master data generator
fs.writeFileSync(
  path.join(__dirname, 'sacredPlacesAuditResult.json'),
  JSON.stringify({ curatedCount: curatedWithSacred, uncuratedCount: uncuratedWithoutSacred, missingTemples, curatedList }, null, 2)
);
console.log('\nSaved full audit result to scripts/sacredPlacesAuditResult.json');
