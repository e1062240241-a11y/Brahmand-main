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

const srisailamRawNearby = [
  { templeId: 'sakshi-ganapati-temple-srisailam', name: 'Sakshi Ganapati Temple' },
  { templeId: 'paladhara-panchadhara-srisailam', name: 'Paladhara Panchadhara Shrine' }
];

const currentTempleKey = 'srisailam';
const seenNearbyKeys = new Set();
const filteredNearbyTemples = [];

for (const t of srisailamRawNearby) {
  const rawItemLower = String(t.templeId || '').toLowerCase().trim();
  const rawItemNameLower = String(t.name || '').toLowerCase().trim();

  let templeItemKey = '';
  if (rawItemLower && curatedKeys.has(rawItemLower)) {
    templeItemKey = rawItemLower;
  } else if (explicitAliases[rawItemLower]) {
    templeItemKey = explicitAliases[rawItemLower];
  } else if (explicitAliases[rawItemNameLower]) {
    templeItemKey = explicitAliases[rawItemNameLower];
  } else {
    templeItemKey = rawItemLower || rawItemNameLower;
  }

  console.log('Evaluating:', t.name, '| chosen key:', templeItemKey);

  if (templeItemKey && templeItemKey !== currentTempleKey && !seenNearbyKeys.has(templeItemKey)) {
    seenNearbyKeys.add(templeItemKey);
    filteredNearbyTemples.push(t);
  }
}

console.log('\n[SRISAILAM NEARBY AFTER FILTER]');
console.log('filtered nearbyTemples count:', filteredNearbyTemples.length);
console.log('filtered names:', filteredNearbyTemples.map(x => x.name));
