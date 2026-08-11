import TEMPLE_DUMP_DATA from '../src/constants/templeDataDump.json';
import { getExploreNearbyData, normalizeTempleKey } from '../src/data/jyotirlingaTravelData';
import { CENTRALIZED_SACRED_PLACES_DATA } from '../src/data/templeSacredPlacesData';

function deepAudit() {
  console.log('========================================');
  console.log('DEEP AUDIT: ALL TEMPLES');
  console.log('========================================\n');

  const results = {
    total: 0,
    hasData: 0,
    noData: 0,
    onlyFallback: 0,
    missingSacred: 0,
    missingTemples: 0,
    duplicateKeys: new Set<string>(),
    byCategory: {} as Record<string, number>,
    bySource: {
      curated: 0,
      centralized: 0,
      fallback: 0,
      none: 0
    },
    missingDetails: [] as any[]
  };

  const allTemples: any[] = TEMPLE_DUMP_DATA || [];
  results.total = allTemples.length;

  for (const temple of allTemples) {
    const templeId = temple.temple_id || temple.id;
    const templeName = temple.name;
    const category = temple.category || 'Sacred';
    
    // Track categories
    results.byCategory[category] = (results.byCategory[category] || 0) + 1;

    // Get nearby data
    const data = getExploreNearbyData(templeId, templeName, category);
    
    const hasSacredPlaces = data.nearbySacredPlaces?.length > 0;
    const hasNearbyTemples = data.nearbyTemples?.length > 0;
    const hasData = hasSacredPlaces || hasNearbyTemples;

    if (hasData) {
      results.hasData++;
      
      // Track source
      if (data.hasCuratedData) {
        results.bySource.curated++;
      } else if (hasSacredPlaces) {
        results.bySource.centralized++;
      } else if (hasNearbyTemples) {
        results.bySource.fallback++;
      }
    } else {
      results.noData++;
      results.missingDetails.push({
        id: templeId,
        name: templeName,
        category: category,
        hasCoords: !!temple.coords
      });
    }

    // Check if missing sacred places specifically
    if (!hasSacredPlaces) {
      results.missingSacred++;
    }
    if (!hasNearbyTemples) {
      results.missingTemples++;
    }

    // Check key uniqueness
    const key = normalizeTempleKey(templeId);
    if (key) {
      if (results.duplicateKeys.has(key)) {
        console.log(`⚠️ Duplicate key: ${key} for ${templeName}`);
      }
      results.duplicateKeys.add(key);
    }
  }

  // Print results
  console.log('📊 SUMMARY');
  console.log(`Total Temples: ${results.total}`);
  console.log(`✅ Has Data: ${results.hasData} (${(results.hasData/results.total*100).toFixed(1)}%)`);
  console.log(`❌ No Data: ${results.noData} (${(results.noData/results.total*100).toFixed(1)}%)`);
  console.log(`\n📂 Data Source Breakdown:`);
  console.log(`  - Curated: ${results.bySource.curated}`);
  console.log(`  - Centralized: ${results.bySource.centralized}`);
  console.log(`  - Coordinate Fallback: ${results.bySource.fallback}`);
  console.log(`  - None: ${results.bySource.none}`);
  console.log(`\n📌 Missing Specifically:`);
  console.log(`  - Missing Sacred Places: ${results.missingSacred}`);
  console.log(`  - Missing Nearby Temples: ${results.missingTemples}`);
  
  if (results.missingDetails.length > 0) {
    console.log(`\n⚠️ TOP 10 TEMPLES WITH NO DATA:`);
    results.missingDetails.slice(0, 10).forEach((t, i) => {
      console.log(`  ${i+1}. ${t.name} (${t.category})${t.hasCoords ? ' ✅ has coords' : ' ❌ no coords'}`);
    });
  }

  console.log(`\n🔑 Unique Keys: ${results.duplicateKeys.size}`);
  console.log('========================================');
  
  return results;
}

// Run the deep audit
const results = deepAudit();

export default results;
