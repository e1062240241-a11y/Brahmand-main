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

// Extract registered IDs
const registeredIds = [];
const imageLines = imagesContent.split('\n');
for (const line of imageLines) {
  const m = line.match(/^\s*'([^']+)'\s*:/);
  if (m) {
    registeredIds.push(m[1]);
  }
}

// Base key normalizer without category prefix
function getBaseKey(id) {
  if (aliases[id]) return aliases[id];
  return id.replace(/^(jyotirling|chardham|other|shaktipeeth|shakti|healing|sacred|ashtavinayak|panchbhoota|vishnu|shiva|devi|hanuman)-/, '');
}

const uniqueEntities = new Map();

for (const id of registeredIds) {
  const baseKey = getBaseKey(id);
  if (!uniqueEntities.has(baseKey)) {
    uniqueEntities.set(baseKey, []);
  }
  uniqueEntities.get(baseKey).push(id);
}

const coveredEntities = [];
const missingEntities = [];

for (const [baseKey, ids] of uniqueEntities.entries()) {
  const isCurated = ids.some(id => curatedKeys.has(id)) || curatedKeys.has(baseKey);
  if (isCurated) {
    coveredEntities.push({ baseKey, ids });
  } else {
    missingEntities.push({ baseKey, ids });
  }
}

console.log('========================================');
console.log('UNIQUE PHYSICAL TEMPLE ENTITY AUDIT');
console.log('========================================');
console.log(`Total Registered Asset Keys  : ${registeredIds.length}`);
console.log(`Unique Physical Temple Sites : ${uniqueEntities.size}`);
console.log(`Curated Temple Sites         : ${coveredEntities.length}`);
console.log(`Missing Curated Data Backlog  : ${missingEntities.length}`);
console.log('========================================\n');

console.log('--- CURATED PHYSICAL TEMPLES ---');
coveredEntities.forEach(c => console.log(`✓ Base Key: "${c.baseKey}" (IDs: ${c.ids.join(', ')})`));

console.log('\n--- SAMPLE MISSING BACKLOG ENTRIES (First 20) ---');
missingEntities.slice(0, 20).forEach((m, idx) => {
  console.log(`${idx + 1}. Base Key: "${m.baseKey}" | Registered IDs: ${m.ids.join(', ')}`);
});
