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
    if (cleanedInput.includes(item.kw)) {
      return item.canonical;
    }
  }

  return lower;
}

const missingBacklog = [];
const seenCanonicals = new Set();

for (const id of registeredIds) {
  const canonical = normalizeTempleKey(id);
  if (seenCanonicals.has(canonical)) continue;
  seenCanonicals.add(canonical);

  if (!curatedKeys.has(canonical)) {
    // Deduce category and readable name
    let category = 'Other Sacred Temple';
    if (id.startsWith('shakti') || id.startsWith('devi')) category = 'Shakti Peetha / Devi';
    else if (id.startsWith('shiva')) category = 'Shiva Temple';
    else if (id.startsWith('vishnu') || id.startsWith('chardham')) category = 'Vishnu / Char Dham';
    else if (id.startsWith('hanuman')) category = 'Hanuman Temple';
    else if (id.startsWith('ashtavinayak')) category = 'Ganesh Temple';
    else if (id.startsWith('panchbhoota')) category = 'Panchbhoota Stalam';
    else if (id.startsWith('healing')) category = 'Sacred Healing Shrine';

    const readableName = id.replace(/^(jyotirling|chardham|other|shaktipeeth|shakti|healing|sacred|ashtavinayak|panchbhoota|vishnu|shiva|devi|hanuman)-/, '')
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    missingBacklog.push({
      canonicalKey: canonical,
      sampleId: id,
      name: readableName,
      category
    });
  }
}

fs.writeFileSync(
  path.join(__dirname, '../scripts/missing_backlog.json'),
  JSON.stringify(missingBacklog, null, 2)
);

console.log(`Successfully generated missing backlog JSON containing ${missingBacklog.length} unique canonical temples.`);
