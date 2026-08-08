const fs = require('fs');
const path = require('path');

const travelDataPath = path.join(__dirname, '../src/data/jyotirlingaTravelData.ts');
const imagesPath = path.join(__dirname, '../src/constants/templeImages.ts');

const travelDataContent = fs.readFileSync(travelDataPath, 'utf-8');
const imagesContent = fs.readFileSync(imagesPath, 'utf-8');

// 1. Extract TEMPLE_KEY_ALIASES
const aliasMatches = travelDataContent.match(/TEMPLE_KEY_ALIASES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\};/);
const explicitAliases = {};
if (aliasMatches) {
  for (const line of aliasMatches[1].split('\n')) {
    const m = line.match(/'([^']+)'\s*:\s*'([^']+)'/);
    if (m) explicitAliases[m[1]] = m[2];
  }
}

// 2. Extract EXPLORE_NEARBY_DATA keys
const curatedMatches = travelDataContent.match(/EXPLORE_NEARBY_DATA:\s*Record<[\s\S]*?=\s*\{([\s\S]*?)\n\};/);
const curatedKeys = new Set();
if (curatedMatches) {
  for (const line of curatedMatches[1].split('\n')) {
    const m = line.match(/^\s*['"]?([a-z0-9-]+)['"]?\s*:\s*\{/);
    if (m) curatedKeys.add(m[1]);
  }
}

// 3. Extract asset IDs
const registeredAssetIds = [];
for (const line of imagesContent.split('\n')) {
  const m = line.match(/^\s*'([^']+)'\s*:/);
  if (m) registeredAssetIds.push(m[1]);
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
  return lower;
}

function getExploreNearbyData(templeId, templeName = '') {
  let idCandidate = normalizeTempleKey(templeId);
  let nameCandidate = templeName ? normalizeTempleKey(templeName) : '';
  let idNormalized = normalizeTempleKey(templeId.replace(/^(jyotirling|chardham|other|shaktipeeth|shakti|healing|sacred|ashtavinayak|panchbhoota|vishnu|shiva|devi|hanuman)-/, ''));
  let nameNormalized = templeName ? normalizeTempleKey(templeName.replace(/temple|dham|shrine|mandir|matha|kshetra/gi, '').trim()) : '';

  let currentTempleKey = '';
  let resolvedFrom = 'none';

  if (curatedKeys.has(idCandidate)) {
    currentTempleKey = idCandidate;
    resolvedFrom = 'idCandidate';
  } else if (curatedKeys.has(nameCandidate)) {
    currentTempleKey = nameCandidate;
    resolvedFrom = 'nameCandidate';
  } else if (curatedKeys.has(idNormalized)) {
    currentTempleKey = idNormalized;
    resolvedFrom = 'idNormalized';
  } else if (curatedKeys.has(nameNormalized)) {
    currentTempleKey = nameNormalized;
    resolvedFrom = 'nameNormalized';
  } else {
    currentTempleKey = idCandidate || nameCandidate || idNormalized || nameNormalized;
    resolvedFrom = 'fallback';
  }

  return {
    rawId: templeId,
    rawName: templeName,
    idCandidate,
    nameCandidate,
    resolvedFrom,
    currentTempleKey,
    hasCuratedData: curatedKeys.has(currentTempleKey)
  };
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
    { pattern: /^karni-mata/, canonical: 'karni-mata-temple-deshnoke' },
    { pattern: /^dakshineswar/, canonical: 'dakshineswar-kali-temple-kolkata' },
    { pattern: /^kamakshi-amman/, canonical: 'kamakshi-amman-temple-kanchipuram' },
    { pattern: /^iskcon-temple-bangalore|^iskcon-bangalore/, canonical: 'other-iskcon-temple-bangalore-karnataka' },
    { pattern: /^iskcon-juhu|^iskcon-temple-mumbai-juhu/, canonical: "other-iskcon-juhu" },
    { pattern: /^iskcon-mira-road/, canonical: "other-iskcon-mira-road-thane" },
  ];
  for (const item of coreUnifications) {
    if (item.pattern.test(stripped) || item.pattern.test(rawId)) return item.canonical;
  }
  return stripped;
}

// Group asset IDs into physical entities
const physicalEntitiesMap = new Map();
for (const assetId of registeredAssetIds) {
  const physKey = getPhysicalEntityKey(assetId);
  if (!physicalEntitiesMap.has(physKey)) {
    physicalEntitiesMap.set(physKey, []);
  }
  physicalEntitiesMap.get(physKey).push(assetId);
}

// Audit Curated Coverage
let passCount = 0;
let failCount = 0;
const failures = [];

for (const [physKey, assetIds] of physicalEntitiesMap.entries()) {
  const isCurated = curatedKeys.has(physKey) || assetIds.some(id => curatedKeys.has(id));
  if (!isCurated) continue;

  // Test with asset ID
  const primaryAssetId = assetIds[0];
  const humanReadableName = primaryAssetId
    .replace(/^(jyotirling|chardham|other|shaktipeeth|shakti|healing|sacred|ashtavinayak|panchbhoota|vishnu|shiva|devi|hanuman)-/, '')
    .replace(/-/g, ' ');

  // Test 1: Direct Asset ID resolution
  const resAsset = getExploreNearbyData(primaryAssetId, humanReadableName);

  // Test 2: Opaque DB ID + Human Readable Name resolution
  const resOpaque = getExploreNearbyData('08pXdMR1eLLkHjrtHADk_opaque_test', humanReadableName);

  const passed = resAsset.hasCuratedData || resOpaque.hasCuratedData;

  if (passed) {
    passCount++;
  } else {
    failCount++;
    failures.push({
      physKey,
      assetIds,
      primaryAssetId,
      humanReadableName,
      resAsset,
      resOpaque
    });
  }
}

console.log('========================================');
console.log('CURATED RUNTIME COVERAGE AUDIT');
console.log('========================================');
console.log(`Physical entities       : ${physicalEntitiesMap.size}`);
console.log(`Curated entities        : ${passCount + failCount}`);
console.log(`Runtime resolver PASS   : ${passCount}`);
console.log(`Runtime resolver FAIL   : ${failCount}`);
console.log('----------------------------------------');

if (failures.length > 0) {
  console.log('FAILURES:');
  failures.forEach((f, idx) => {
    console.log(`\n[Failure ${idx + 1}]`);
    console.log(`Temple/Entity Key : ${f.physKey}`);
    console.log(`Asset IDs         : ${f.assetIds.join(', ')}`);
    console.log(`Human Name        : "${f.humanReadableName}"`);
    console.log(`Asset Res Result  : key="${f.resAsset.currentTempleKey}", hasData=${f.resAsset.hasCuratedData}`);
    console.log(`Opaque Res Result : key="${f.resOpaque.currentTempleKey}", hasData=${f.resOpaque.hasCuratedData}`);
  });
} else {
  console.log('ALL CURATED ENTITIES PASSED RUNTIME RESOLUTION!');
}
console.log('========================================');
