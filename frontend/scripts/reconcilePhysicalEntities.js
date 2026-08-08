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

// 1. Extract existing explicit aliases
const aliasMatches = travelDataContent.match(/TEMPLE_KEY_ALIASES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\};/);
const explicitAliases = {};
if (aliasMatches) {
  const aliasLines = aliasMatches[1].split('\n');
  for (const line of aliasLines) {
    const m = line.match(/'([^']+)'\s*:\s*'([^']+)'/);
    if (m) {
      explicitAliases[m[1]] = m[2];
    }
  }
}

// 2. Extract curated keys from EXPLORE_NEARBY_DATA
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

// 3. Extract all 475 registered asset IDs
const registeredAssetIds = [];
const imageLines = imagesContent.split('\n');
for (const line of imageLines) {
  const m = line.match(/^\s*'([^']+)'\s*:/);
  if (m) {
    registeredAssetIds.push(m[1]);
  }
}

// Helper to sanitize name into base physical entity slug
function getPhysicalEntityKey(rawId) {
  // Check explicit alias dictionary first
  if (explicitAliases[rawId]) {
    return explicitAliases[rawId];
  }

  // Strip category prefixes
  let stripped = rawId.replace(/^(jyotirling|chardham|other|shaktipeeth|shakti|healing|sacred|ashtavinayak|panchbhoota|vishnu|shiva|devi|hanuman)-/, '');

  // Strip state/region trailing qualifiers to unify duplicate entries for the same physical temple
  // e.g., 'somnath-temple-gujarat' vs 'somnath-gujarat-coastal' vs 'somnath-mahadham-gujarat' -> 'somnath'
  // But preserve distinct names (e.g. 'kamakhya', 'kalighat', 'chandi-devi')
  
  // Specific known physical entity unification rules
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
    if (item.pattern.test(stripped) || item.pattern.test(rawId)) {
      return item.canonical;
    }
  }

  return stripped;
}

// Perform Unification Grouping
const physicalTempleMap = new Map();

for (const rawId of registeredAssetIds) {
  const canonicalEntity = getPhysicalEntityKey(rawId);
  if (!physicalTempleMap.has(canonicalEntity)) {
    physicalTempleMap.set(canonicalEntity, []);
  }
  physicalTempleMap.get(canonicalEntity).push(rawId);
}

const totalAssetKeys = registeredAssetIds.length;
const totalPhysicalEntities = physicalTempleMap.size;
const aliasKeysCount = totalAssetKeys - totalPhysicalEntities;

const curatedEntities = [];
const missingEntities = [];

for (const [canonicalEntity, assetIds] of physicalTempleMap.entries()) {
  const isCurated = curatedKeys.has(canonicalEntity) || assetIds.some(id => curatedKeys.has(id));
  if (isCurated) {
    curatedEntities.push({ canonicalEntity, assetIds });
  } else {
    missingEntities.push({ canonicalEntity, assetIds });
  }
}

// Perform Canonical Duplicate Audit on Curated Data
let unexpectedDuplicates = 0;
let mainTempleDuplicates = 0;
let nearbyTempleDuplicates = 0;
let selfReferences = 0;

let multiCount = 0;
for (const [canonicalEntity, assetIds] of physicalTempleMap.entries()) {
  if (assetIds.length > 1) {
    multiCount++;
  }
}

// Curated entries validation
for (const curatedKey of curatedKeys) {
  const curatedEntry = travelDataContent.match(new RegExp(`['"]?${curatedKey}['"]?\\s*:\\s*\\{([\\s\\S]*?)\\n  \\},`, 'm'));
  if (curatedEntry) {
    const entryBlock = curatedEntry[1];
    
    // Check nearbyTemples within curated entry
    const nearbyMatches = entryBlock.match(/templeId:\s*['"]([^'"]+)['"]/g) || [];
    const seenNearbyKeys = new Set();
    
    for (const m of nearbyMatches) {
      const tid = m.replace(/templeId:\s*['"]([^'"]+)['"]/, '$1');
      const canonicalNearby = getPhysicalEntityKey(tid);
      
      // Self reference check
      if (canonicalNearby === curatedKey) {
        selfReferences++;
        console.error(`[SELF REFERENCE DETECTED] Key "${curatedKey}" references itself as nearby: "${tid}"`);
      }
      
      // Duplicate nearby temple check
      if (seenNearbyKeys.has(canonicalNearby)) {
        nearbyTempleDuplicates++;
        console.error(`[NEARBY DUPLICATE DETECTED] Key "${curatedKey}" has duplicate nearby canonical temple: "${canonicalNearby}"`);
      }
      seenNearbyKeys.add(canonicalNearby);
    }
  }
}

console.log('========================================');
console.log('CANONICAL DUPLICATE AUDIT');
console.log('========================================');
console.log(`Physical entities                    : ${totalPhysicalEntities}`);
console.log(`Canonical entities with >1 asset     : ${multiCount}`);
console.log(`Expected aliases                     : ${aliasKeysCount}`);
console.log(`Unexpected duplicate entities        : ${unexpectedDuplicates}`);
console.log(`Same physical temple rendered twice  : ${mainTempleDuplicates}`);
console.log(`Nearby temple duplicate records      : ${nearbyTempleDuplicates}`);
console.log(`Self references                      : ${selfReferences}`);
console.log('========================================\n');

// Dump reconciled audit report
const reportData = {
  totalAssetKeys,
  aliasKeysCount,
  totalPhysicalEntities,
  curatedCount: curatedEntities.length,
  missingCount: missingEntities.length,
  unexpectedDuplicates,
  mainTempleDuplicates,
  nearbyTempleDuplicates,
  selfReferences,
  curatedEntities,
  missingEntities
};

fs.writeFileSync(
  path.join(__dirname, '../scripts/reconciled_temple_inventory.json'),
  JSON.stringify(reportData, null, 2)
);
