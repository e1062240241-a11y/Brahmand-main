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

console.log("=== CHECKING FOR DANGLING ALIASES ===");
let danglingCount = 0;
for (const [opaqueId, canonicalKey] of Object.entries(explicitAliases)) {
  if (!curatedKeys.has(canonicalKey)) {
    console.error(`❌ Alias dangles: ${opaqueId} -> ${canonicalKey} (no EXPLORE_NEARBY_DATA entry)`);
    danglingCount++;
  }
}

if (danglingCount === 0) {
  console.log("✅ Zero dangling aliases found! All TEMPLE_KEY_ALIASES point to valid EXPLORE_NEARBY_DATA keys.");
} else {
  console.log(`Total dangling aliases: ${danglingCount}`);
}

console.log(`\nTotal curated keys in EXPLORE_NEARBY_DATA: ${curatedKeys.size}`);
