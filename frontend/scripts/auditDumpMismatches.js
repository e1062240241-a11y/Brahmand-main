const fs = require('fs');
const path = require('path');

const dump = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/constants/templeDataDump.json'), 'utf-8'));
const travelDataContent = fs.readFileSync(path.join(__dirname, '../src/data/jyotirlingaTravelData.ts'), 'utf-8');
const imagesContent = fs.readFileSync(path.join(__dirname, '../src/constants/templeImages.ts'), 'utf-8');

// Load TEMPLE_KEY_ALIASES
const aliasMatches = travelDataContent.match(/TEMPLE_KEY_ALIASES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\};/);
const explicitAliases = {};
if (aliasMatches) {
  for (const line of aliasMatches[1].split('\n')) {
    const m = line.match(/'([^']+)'\s*:\s*'([^']+)'/);
    if (m) explicitAliases[m[1]] = m[2];
  }
}

// Load EXPLORE_NEARBY_DATA keys
const curatedMatches = travelDataContent.match(/EXPLORE_NEARBY_DATA:\s*Record<[\s\S]*?=\s*\{([\s\S]*?)\n\};/);
const curatedKeys = new Set();
if (curatedMatches) {
  for (const line of curatedMatches[1].split('\n')) {
    const m = line.match(/^\s*['"]?([a-z0-9-]+)['"]?\s*:\s*\{/);
    if (m) curatedKeys.add(m[1]);
  }
}

function getSanitizedNameVariants(rawStr) {
  if (!rawStr) return [];
  const lower = String(rawStr).toLowerCase().trim();
  const rawHyphenated = lower.replace(/[–—\-–,.\x27\x22()]/gi, ' ').replace(/\s+/g, '-').trim();
  const rawAlphanum = lower.replace(/[^a-z0-9]/g, '');
  const strippedWord = lower
    .replace(/[–—\-–,.\x27\x22()]/gi, ' ')
    .replace(/\b(temple|mandir|shrine|dham|devi|mata|ji|sree|sri|shree|shri|ashram)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const strippedHyphenated = strippedWord.replace(/\s+/g, '-');
  const strippedAlphanum = strippedWord.replace(/[^a-z0-9]/g, '');
  return Array.from(new Set([lower, rawHyphenated, rawAlphanum, strippedWord, strippedHyphenated, strippedAlphanum])).filter(Boolean);
}

const dumpAnalysis = dump.map(item => {
  const opaqueId = item.id;
  const slugId = item.temple_id || '';
  const name = item.name || '';
  const category = item.category || '';

  // Does slug resolve to curated data?
  let slugCuratedKey = explicitAliases[slugId] || slugId;
  let slugCurated = curatedKeys.has(slugCuratedKey);

  // Does opaqueId resolve?
  let opaqueCuratedKey = explicitAliases[opaqueId];
  let opaqueCurated = false;
  if (opaqueCuratedKey && curatedKeys.has(opaqueCuratedKey)) {
    opaqueCurated = true;
  } else {
    // Try name resolution
    const nameVariants = getSanitizedNameVariants(name);
    for (const v of nameVariants) {
      if (curatedKeys.has(v)) {
        opaqueCurated = true;
        opaqueCuratedKey = v;
        break;
      }
    }
  }

  return {
    opaqueId,
    slugId,
    name,
    category,
    slugCurated,
    slugCuratedKey,
    opaqueCurated,
    opaqueCuratedKey
  };
});

const mismatches = dumpAnalysis.filter(x => x.slugCurated && !x.opaqueCurated);
console.log('Dump records count:', dumpAnalysis.length);
console.log('Slug Curated count:', dumpAnalysis.filter(x => x.slugCurated).length);
console.log('Opaque ID Curated count:', dumpAnalysis.filter(x => x.opaqueCurated).length);
console.log('Mismatches (Slug Curated BUT Opaque ID Unresolved):', mismatches.length);
console.log('Mismatches List:', JSON.stringify(mismatches, null, 2));

fs.writeFileSync(path.join(__dirname, 'dump_mismatches.json'), JSON.stringify(mismatches, null, 2));
