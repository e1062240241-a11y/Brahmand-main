const fs = require('fs');
const path = require('path');

const dump = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/constants/templeDataDump.json'), 'utf-8'));
const travelDataContent = fs.readFileSync(path.join(__dirname, '../src/data/jyotirlingaTravelData.ts'), 'utf-8');

const aliasMatches = travelDataContent.match(/TEMPLE_KEY_ALIASES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\};/);
const explicitAliases = {};
if (aliasMatches) {
  for (const line of aliasMatches[1].split('\n')) {
    const m = line.match(/'([^']+)'\s*:\s*'([^']+)'/);
    if (m) explicitAliases[m[1]] = m[2];
  }
}

const curatedMatches = travelDataContent.match(/EXPLORE_NEARBY_DATA:\s*Record<[\s\S]*?=\s*\{([\s\S]*?)\n\};/);
const curatedKeys = new Set();
if (curatedMatches) {
  for (const line of curatedMatches[1].split('\n')) {
    const m = line.match(/^\s*['"]?([a-z0-9-]+)['"]?\s*:\s*\{/);
    if (m) curatedKeys.add(m[1]);
  }
}

console.log("=== COMPREHENSIVE TWO-HOP RESOLUTION AUDIT ===");

// Check 1: Dangling Aliases (Alias -> EXPLORE_NEARBY_DATA)
let danglingCount = 0;
for (const [opaqueId, canonicalKey] of Object.entries(explicitAliases)) {
  if (!curatedKeys.has(canonicalKey)) {
    console.error(`❌ DANGLING ALIAS: ${opaqueId} -> ${canonicalKey} (not in EXPLORE_NEARBY_DATA)`);
    danglingCount++;
  }
}

// Check 2: Dump Opaque IDs mapped to curated keys but dangling
let dumpDanglingCount = 0;
for (const item of dump) {
  const opaqueId = item.id;
  const canonicalKey = explicitAliases[opaqueId];
  if (canonicalKey && !curatedKeys.has(canonicalKey)) {
    console.error(`❌ DUMP ITEM DANGLING: ${item.name} (${opaqueId}) -> ${canonicalKey}`);
    dumpDanglingCount++;
  }
}

console.log(`\nAudit Results:`);
console.log(`- Total Curated Keys in EXPLORE_NEARBY_DATA: ${curatedKeys.size}`);
console.log(`- Total Mapped Aliases in TEMPLE_KEY_ALIASES: ${Object.keys(explicitAliases).length}`);
console.log(`- Dangling Aliases Count: ${danglingCount}`);
console.log(`- Dump Items Dangling Count: ${dumpDanglingCount}`);

if (danglingCount === 0 && dumpDanglingCount === 0) {
  console.log("\n🎉 ALL RESOLUTION HOPS VALIDATED! 0 DANGLING ALIASES FOUND.");
}
