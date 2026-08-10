const fs = require('fs');
const path = require('path');
const { resolveTempleTransport, resolveTempleCanonicalKeys } = require('../src/data/templeTransportResolver');
const { CURATED_TEMPLE_TRANSPORT, TEMPLE_TRANSPORT_ALIASES } = require('../src/data/templeTransportData');

const dumpPath = path.join(__dirname, '../src/constants/templeDataDump.json');
const dumpTemples = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

// Import arrays from jyotirlingaTravelData
const jyotirlingaPath = path.join(__dirname, '../src/data/jyotirlingaTravelData.ts');
const jyotirlingaContent = fs.readFileSync(jyotirlingaPath, 'utf8');

function extractExportedArrayNames(fileContent, arrayName) {
  const regex = new RegExp(`export const ${arrayName}:\\s*CircuitJourneyItem\\[\\]\\s*=\\s*\\[([\\s\\S]*?)\\];`, 'm');
  const match = fileContent.match(regex);
  if (!match) return [];
  const rawItems = match[1];
  const items = [];
  const itemRegex = /templeId:\s*'([^']+)',\s*name:\s*'([^']+)',\s*state:\s*'([^']+)'/g;
  let m;
  while ((m = itemRegex.exec(rawItems)) !== null) {
    items.push({ templeId: m[1], name: m[2], state: m[3] });
  }
  return items;
}

const jyotirlingas = extractExportedArrayNames(jyotirlingaContent, 'ALL_12_JYOTIRLINGAS');
const shaktiPeethas = extractExportedArrayNames(jyotirlingaContent, 'ALL_SHAKTI_PEETHAS');
const charDham = extractExportedArrayNames(jyotirlingaContent, 'ALL_CHAR_DHAM');
const healingFromData = extractExportedArrayNames(jyotirlingaContent, 'ALL_HEALING_TEMPLES');
const sacredFromData = extractExportedArrayNames(jyotirlingaContent, 'ALL_SACRED_DESTINATIONS');

// Combine all category inventories
const categoriesToAudit = [
  { category: 'Jyotirlingas', items: jyotirlingas },
  { category: 'Shakti Peethas', items: shaktiPeethas },
  { category: 'Char Dham', items: charDham },
  { category: 'Healing Temples', items: healingFromData },
  { category: 'Sacred Destinations', items: sacredFromData },
];

// Add database dump items categorized
const categoryMap = {};
dumpTemples.forEach(t => {
  const cat = t.category || 'Sacred';
  if (!categoryMap[cat]) categoryMap[cat] = [];
  categoryMap[cat].push({
    id: t.id,
    templeId: t.temple_id || t.id,
    name: t.name,
    location: t.location,
    nearest_airport: t.nearest_airport,
    nearest_railway: t.nearest_railway,
    nearest_bus_stand: t.nearest_bus_stand,
    category: cat,
  });
});

Object.keys(categoryMap).forEach(cat => {
  if (!categoriesToAudit.some(c => c.category === cat)) {
    categoriesToAudit.push({ category: cat, items: categoryMap[cat] });
  }
});

console.log('========================================================');
console.log('TEMPLE TRANSPORT COVERAGE AUDIT');
console.log('========================================================\n');

let grandTotal = 0;
let grandPassed = 0;
let grandMissingTransport = 0;
let grandMissingAir = 0;
let grandMissingRail = 0;
let grandMissingBus = 0;
let grandMissingKey = 0;
let grandMissingAlias = 0;
let grandUnresolved = 0;

// Duplicate Key Check
const seenAliases = {};
let duplicateAliasesCount = 0;
for (const [alias, canonical] of Object.entries(TEMPLE_TRANSPORT_ALIASES)) {
  if (seenAliases[alias] && seenAliases[alias] !== canonical) {
    console.error(`❌ DUPLICATE ALIAS CONFLICT: "${alias}" maps to "${seenAliases[alias]}" AND "${canonical}"`);
    duplicateAliasesCount++;
  } else {
    seenAliases[alias] = canonical;
  }
}

const auditResultsByCategory = [];

categoriesToAudit.forEach(({ category, items }) => {
  let catTotal = items.length;
  let catPassed = 0;

  items.forEach(item => {
    grandTotal++;
    const res = resolveTempleTransport({
      temple: item,
      templeId: item.templeId || item.id,
      templeName: item.name,
      category: category,
    });

    const airOk = Boolean(res.air && res.air.trim().length > 0);
    const railOk = Boolean(res.rail && res.rail.trim().length > 0);
    const busOk = Boolean(res.bus && res.bus.trim().length > 0);

    const isComplete = airOk && railOk && busOk;

    if (!airOk) grandMissingAir++;
    if (!railOk) grandMissingRail++;
    if (!busOk) grandMissingBus++;

    if (isComplete) {
      catPassed++;
      grandPassed++;
    } else {
      grandMissingTransport++;
      grandUnresolved++;
      console.log(`[MISSING] [${category}] ${item.name} (${item.templeId || item.id})`);
      console.log(`   ✈️ Air:  ${res.air || '(EMPTY)'}`);
      console.log(`   🚆 Rail: ${res.rail || '(EMPTY)'}`);
      console.log(`   🚌 Bus:  ${res.bus || '(EMPTY)'}`);
    }
  });

  auditResultsByCategory.push({ category, total: catTotal, passed: catPassed });
});

console.log('CATEGORY BREAKDOWN:');
auditResultsByCategory.forEach(r => {
  console.log(`${r.category}:`);
  console.log(`  ${r.passed} / ${r.total} complete`);
});

console.log('\n--------------------------------------------------------');
console.log(`TOTAL AUDITED ENTITIES: ${grandTotal}`);
console.log(`Passed (100% Air + Rail + Bus): ${grandPassed} / ${grandTotal}`);
console.log('--------------------------------------------------------');
console.log(`Missing transport records: ${grandMissingTransport}`);
console.log(`Missing Air: ${grandMissingAir}`);
console.log(`Missing Rail: ${grandMissingRail}`);
console.log(`Missing Bus: ${grandMissingBus}`);
console.log(`Missing canonical keys: ${grandMissingKey}`);
console.log(`Missing aliases: ${grandMissingAlias}`);
console.log(`Duplicate alias conflicts: ${duplicateAliasesCount}`);
console.log(`Unresolved temples: ${grandUnresolved}`);
console.log('========================================================\n');

if (grandPassed === grandTotal && duplicateAliasesCount === 0) {
  console.log('🎉 AUDIT PASSED: 100% Inventory Resolved across ALL Categories!');
  process.exit(0);
} else {
  console.error('❌ AUDIT FAILED: Data or key gaps remain.');
  process.exit(1);
}
