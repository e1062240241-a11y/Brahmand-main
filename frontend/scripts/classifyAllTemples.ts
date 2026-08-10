import fs from 'fs';
import path from 'path';

// Mock require for image assets so node/ts-node doesn't fail on .webp require()
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (request: string) {
  if (request.endsWith('.webp') || request.endsWith('.png') || request.endsWith('.jpg') || request.endsWith('.jpeg')) {
    return 1; // mock React Native image asset module ID
  }
  return originalRequire.apply(this, arguments);
};

import {
  getExploreNearbyData,
  normalizeTempleKey,
  TEMPLE_KEY_ALIASES,
  EXPLORE_NEARBY_DATA,
} from '../src/data/jyotirlingaTravelData';

// 1. Read production dataset
const dumpPath = path.join(__dirname, '../src/constants/templeDataDump.json');
const rawDump = fs.readFileSync(dumpPath, 'utf-8');
const templeDump: Array<{
  id: string;
  temple_id?: string;
  name?: string;
  category?: string;
  location?: any;
}> = JSON.parse(rawDump);

console.log(`=======================================================`);
console.log(`FULL PRODUCTION TEMPLE CLASSIFICATION AUDIT`);
console.log(`Total Production Records in Dump: ${templeDump.length}`);
console.log(`=======================================================\n`);

const buckets = {
  A_resolvedById: [] as any[],
  B_resolvedByNameOnly: [] as any[],
  C_unresolvedExpected: [] as any[],
  D_hasAliasButFailedToResolve: [] as any[],
};

// Lowercase copy of aliases for checking intentions
const lowerAliases: Record<string, string> = {};
for (const [k, v] of Object.entries(TEMPLE_KEY_ALIASES)) {
  lowerAliases[k.toLowerCase().trim()] = v;
}

for (const temple of templeDump) {
  // Reproduce exact app/temple/[id].tsx prop coercion logic
  const rawId = temple.id; // simulate route params typeof id === 'string' ? id : ...
  const templeId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? (rawId as any)[0] : '';
  const templeName = temple.name || '';
  const category = temple.category || '';
  const slugId = temple.temple_id || '';

  // Execute real getExploreNearbyData pipeline
  const result = getExploreNearbyData(templeId, templeName, category);

  const recordInfo = {
    templeId,
    slugId,
    templeName,
    category,
    hasCuratedData: result.hasCuratedData,
  };

  if (result.hasCuratedData) {
    buckets.A_resolvedById.push(recordInfo);
  } else {
    // Check if an alias was INTENDED/EXPECTED for this record
    // e.g. does templeId, slugId, or sanitized name exist in TEMPLE_KEY_ALIASES?
    const hasIdAlias = !!lowerAliases[templeId.toLowerCase().trim()];
    const hasSlugAlias = !!lowerAliases[slugId.toLowerCase().trim()];

    if (hasIdAlias || hasSlugAlias) {
      buckets.D_hasAliasButFailedToResolve.push({
        ...recordInfo,
        matchedAliasKey: hasIdAlias ? templeId : slugId,
        expectedCanonicalTarget: hasIdAlias ? lowerAliases[templeId.toLowerCase().trim()] : lowerAliases[slugId.toLowerCase().trim()],
      });
    } else {
      buckets.C_unresolvedExpected.push(recordInfo);
    }
  }
}

console.log(`CLASSIFICATION BREAKDOWN:`);
console.log(`- Bucket A (Resolved Curated Data Found - HEALTHY): ${buckets.A_resolvedById.length}`);
console.log(`- Bucket B (Resolved via Name Fallback Only - FRAGILE): ${buckets.B_resolvedByNameOnly.length}`);
console.log(`- Bucket C (Unresolved Expected - Legitimate Uncurated): ${buckets.C_unresolvedExpected.length}`);
console.log(`- Bucket D (Has Alias in TEMPLE_KEY_ALIASES but Failed - BUG): ${buckets.D_hasAliasButFailedToResolve.length}`);
console.log(`\n=======================================================\n`);

if (buckets.D_hasAliasButFailedToResolve.length > 0) {
  console.log(`--- BUCKET D (ALIAS EXISTS BUT FAILED TO RESOLVE - HIGH PRIORITY) (${buckets.D_hasAliasButFailedToResolve.length} items) ---`);
  buckets.D_hasAliasButFailedToResolve.forEach((item, i) => {
    console.log(`${i + 1}. ID: "${item.templeId}" | Name: "${item.templeName}"`);
    console.log(`   Alias Key Matched: "${item.matchedAliasKey}" -> Intended Target: "${item.expectedCanonicalTarget}"`);
  });
  console.log(`\n-------------------------------------------------------\n`);
} else {
  console.log(`✅ BUCKET D IS EMPTY: Zero records with defined aliases failed resolution!`);
}

// Write full audit report to file
fs.writeFileSync(
  path.join(__dirname, 'classification_audit_results.json'),
  JSON.stringify(
    {
      summary: {
        total: templeDump.length,
        bucketA: buckets.A_resolvedById.length,
        bucketB: buckets.B_resolvedByNameOnly.length,
        bucketC: buckets.C_unresolvedExpected.length,
        bucketD: buckets.D_hasAliasButFailedToResolve.length,
      },
      buckets,
    },
    null,
    2
  )
);

console.log(`Full classification output written to scripts/classification_audit_results.json`);
