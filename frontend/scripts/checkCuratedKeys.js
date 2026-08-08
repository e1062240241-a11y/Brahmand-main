const fs = require('fs');
const travelDataContent = fs.readFileSync('./src/data/jyotirlingaTravelData.ts', 'utf-8');
const imagesContent = fs.readFileSync('./src/constants/templeImages.ts', 'utf-8');

// 1. Extract explicit aliases from TEMPLE_KEY_ALIASES
const aliasMatches = travelDataContent.match(/TEMPLE_KEY_ALIASES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\};/);
const explicitAliases = {};
if (aliasMatches) {
  for (const line of aliasMatches[1].split('\n')) {
    const m = line.match(/'([^']+)'\s*:\s*'([^']+)'/);
    if (m) explicitAliases[m[1]] = m[2];
  }
}

// 2. Extract curated keys from EXPLORE_NEARBY_DATA
const curatedMatches = travelDataContent.match(/EXPLORE_NEARBY_DATA:\s*Record<[\s\S]*?=\s*\{([\s\S]*?)\n\};/);
const curatedKeys = new Set();
if (curatedMatches) {
  for (const line of curatedMatches[1].split('\n')) {
    const m = line.match(/^\s*['"]?([a-z0-9-]+)['"]?\s*:\s*\{/);
    if (m) curatedKeys.add(m[1]);
  }
}

// 3. Extract asset keys from TEMPLE_IMAGES
const registeredAssetIds = [];
for (const line of imagesContent.split('\n')) {
  const m = line.match(/^\s*'([^']+)'\s*:/);
  if (m) registeredAssetIds.push(m[1]);
}

function getPhysicalEntityKey(rawId) {
  if (explicitAliases[rawId]) return explicitAliases[rawId];
  let stripped = rawId.replace(/^(jyotirling|chardham|other|shaktipeeth|shakti|healing|sacred|ashtavinayak|panchbhoota|vishnu|shiva|devi|hanuman)-/, '');

  const coreUnifications = [
    { pattern: /^somnath/, canonical: 'somnath' },
    { pattern: /^kedarnath/, canonical: 'kedarnath' },
    { pattern: /^badrinath/, canonical: 'badrinath' },
    { pattern: /^dwarkadhish/, canonical: 'dwarkadhish' },
    { pattern: /^jagannath/, canonical: 'jagannath-puri' },
    { pattern: /^mahakal/, canonical: 'mahakaleshwar' },
    { pattern: /^kashi-vishwanath/, canonical: 'kashi-vishwanath' },
    { pattern: /^baidyanath/, canonical: 'baidyanath' },
    { pattern: /^grishneshwar/, canonical: 'grishneshwar' },
    { pattern: /^omkareshwar/, canonical: 'omkareshwar' },
    { pattern: /^bhimashankar/, canonical: 'bhimashankar' },
    { pattern: /^trimbakeshwar/, canonical: 'trimbakeshwar' },
    { pattern: /^nageshwar/, canonical: 'nageshwar' },
    { pattern: /^ramanathaswamy/, canonical: 'ramanathaswamy' },
    { pattern: /^srisailam/, canonical: 'srisailam' },
    { pattern: /^mallikarjuna/, canonical: 'srisailam' },
    { pattern: /^tanot/, canonical: 'tanot-mata' },
    { pattern: /^tirupati-balaji/, canonical: 'other-tirupati-balaji-temple-andhra-pradesh' },
    { pattern: /^vaishno-devi/, canonical: 'other-vaishno-devi-temple-jammu-kashmir' },
    { pattern: /^siddhivinayak/, canonical: 'other-siddhivinayak-temple-mumbai' },
    { pattern: /^shirdi-sai/, canonical: 'other-shirdi-sai-baba-temple-maharashtra' },
    { pattern: /^gangotri/, canonical: 'chardham-gangotri-temple-uttarakhand' },
    { pattern: /^yamunotri/, canonical: 'chardham-yamunotri-temple-uttarakhand' },
    { pattern: /^golden-temple/, canonical: 'other-golden-temple-amritsar' },
    { pattern: /^meenakshi/, canonical: 'other-meenakshi-temple-madurai' },
    { pattern: /^kamakhya/, canonical: 'shaktipeeth-kamakhya-temple-guwahati' },
    { pattern: /^kalighat/, canonical: 'shaktipeeth-kalighat-kali-temple-kolkata' },
    { pattern: /^tarapith/, canonical: 'shaktipeeth-tarapith-temple-birbhum' },
    { pattern: /^ambaji/, canonical: 'shaktipeeth-ambaji-temple-gujarat' },
    { pattern: /^jwala-ji/, canonical: 'shaktipeeth-jwala-ji-temple-kangra' },
    { pattern: /^chinnamasta/, canonical: 'shaktipeeth-chinnamasta-temple-rajarappa' },
    { pattern: /^mahalaxmi-temple-kolhapur|^mahalaxmi-kolhapur/, canonical: 'shaktipeeth-mahalaxmi-temple-kolhapur' },
    { pattern: /^chamundeshwari-temple-mysore|^chamundeshwari-mysore/, canonical: 'shaktipeeth-chamundeshwari-temple-mysore' },
    { pattern: /^karni-mata/, canonical: 'shaktipeeth-karni-mata-temple-deshnoke' },
    { pattern: /^dakshineswar/, canonical: 'shaktipeeth-dakshineswar-kali-temple-kolkata' },
    { pattern: /^kamakshi-amman/, canonical: 'shaktipeeth-kamakshi-amman-temple-kanchipuram' },
    { pattern: /^iskcon-temple-bangalore|^iskcon-bangalore/, canonical: 'other-iskcon-temple-bangalore-karnataka' },
    { pattern: /^iskcon-juhu|^iskcon-temple-mumbai-juhu/, canonical: 'other-iskcon-juhu' },
    { pattern: /^iskcon-mira-road/, canonical: 'other-iskcon-mira-road-thane' },
  ];

  for (const item of coreUnifications) {
    if (item.pattern.test(stripped) || item.pattern.test(rawId)) return item.canonical;
  }
  return stripped;
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

const physicalEntitiesMap = new Map();
for (const assetId of registeredAssetIds) {
  const physKey = getPhysicalEntityKey(assetId);
  if (!physicalEntitiesMap.has(physKey)) {
    physicalEntitiesMap.set(physKey, []);
  }
  physicalEntitiesMap.get(physKey).push(assetId);
}

for (const curatedKey of curatedKeys) {
  const foundInPhysicalMap = physicalEntitiesMap.has(curatedKey);
  console.log('Curated key:', curatedKey, '| Found in 409 physical entities:', foundInPhysicalMap);
}
