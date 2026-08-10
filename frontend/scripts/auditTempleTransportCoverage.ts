import {
  ALL_12_JYOTIRLINGAS,
  ALL_SHAKTI_PEETHAS,
  ALL_CHAR_DHAM,
  ALL_HEALING_TEMPLES,
  ALL_SACRED_DESTINATIONS,
} from '../src/data/jyotirlingaTravelData';
import { resolveTempleTransport } from '../src/data/templeTransportResolver';

interface AuditResult {
  templeId: string;
  templeName: string;
  category: string;
  matchedKey: string | null;
  air: string;
  rail: string;
  bus: string;
  status: 'PASS' | 'MISSING_KEY' | 'MISSING_AIR' | 'MISSING_RAIL' | 'MISSING_BUS' | 'MISSING_ALL';
}

function runAudit() {
  console.log('\n============== TEMPLE TRANSPORT COVERAGE AUDIT ==============\n');

  const inventories: { category: string; list: any[] }[] = [
    { category: 'Jyotirlinga', list: ALL_12_JYOTIRLINGAS },
    { category: 'Shakti Peetha', list: ALL_SHAKTI_PEETHAS },
    { category: 'Char Dham', list: ALL_CHAR_DHAM },
    { category: 'Healing', list: ALL_HEALING_TEMPLES },
    { category: 'Sacred', list: ALL_SACRED_DESTINATIONS },
  ];

  // Deduplicate items by templeId / name
  const seen = new Set<string>();
  const allCuratedTemples: { templeId: string; name: string; category: string }[] = [];

  for (const inv of inventories) {
    for (const item of inv.list) {
      const key = `${item.templeId}-${item.name}`;
      if (!seen.has(key)) {
        seen.add(key);
        allCuratedTemples.push({
          templeId: item.templeId,
          name: item.name,
          category: inv.category,
        });
      }
    }
  }

  // Add specific problem case temples mentioned in requirements
  const testCases = [
    { templeId: 'horanadu-annapoorna', name: 'Annapoorneshwari Temple – Horanadu', category: 'Healing' },
    { templeId: 'vaitheeswaran-koil', name: 'Vaitheeswaran Koil', category: 'Healing' },
    { templeId: 'sankat-mochan', name: 'Sankat Mochan Hanuman Temple', category: 'Healing' },
    { templeId: 'srikalahasti-temple', name: 'Srikalahasti Temple', category: 'Healing' },
    { templeId: 'aurobindo-ashram', name: 'Sri Aurobindo Ashram', category: 'Sacred' },
    { templeId: 'ambalappuzha-krishna', name: 'Ambalappuzha Sri Krishna Temple – Alappuzha', category: 'Sacred' },
  ];

  for (const tc of testCases) {
    const key = `${tc.templeId}-${tc.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      allCuratedTemples.push(tc);
    }
  }

  const results: AuditResult[] = [];
  let passCount = 0;
  let missingKeyCount = 0;
  let missingAirCount = 0;
  let missingRailCount = 0;
  let missingBusCount = 0;

  for (const temple of allCuratedTemples) {
    const transport = resolveTempleTransport({
      templeId: temple.templeId,
      templeName: temple.name,
      category: temple.category,
    });

    const hasAir = Boolean(transport.air);
    const hasRail = Boolean(transport.rail);
    const hasBus = Boolean(transport.bus);

    let status: AuditResult['status'] = 'PASS';

    if (!hasAir && !hasRail && !hasBus) {
      status = 'MISSING_ALL';
      missingKeyCount++;
    } else if (!hasAir) {
      status = 'MISSING_AIR';
      missingAirCount++;
    } else if (!hasRail) {
      status = 'MISSING_RAIL';
      missingRailCount++;
    } else if (!hasBus) {
      status = 'MISSING_BUS';
      missingBusCount++;
    } else {
      passCount++;
    }

    results.push({
      templeId: temple.templeId,
      templeName: temple.name,
      category: temple.category,
      matchedKey: null,
      air: transport.air,
      rail: transport.rail,
      bus: transport.bus,
      status,
    });

    console.log(`[${status}] [${temple.category}] ${temple.name} (${temple.templeId})`);
    console.log(`   ✈️ Air:  ${transport.air || '(EMPTY)'}`);
    console.log(`   🚆 Rail: ${transport.rail || '(EMPTY)'}`);
    console.log(`   🚌 Bus:  ${transport.bus || '(EMPTY)'}\n`);
  }

  console.log('=============================================================');
  console.log(`SUMMARY:`);
  console.log(`Total Curated Temples Audited: ${allCuratedTemples.length}`);
  console.log(`Passed (All 3 Modes Available): ${passCount}`);
  console.log(`Missing Key / All Modes: ${missingKeyCount}`);
  console.log(`Missing Air: ${missingAirCount}`);
  console.log(`Missing Rail: ${missingRailCount}`);
  console.log(`Missing Bus: ${missingBusCount}`);
  console.log('=============================================================\n');

  if (missingKeyCount > 0 || missingAirCount > 0 || missingRailCount > 0 || missingBusCount > 0) {
    console.error('AUDIT FAILED: Some curated temples are missing transport data.');
    process.exit(1);
  } else {
    console.log('AUDIT PASSED SUCCESSFUL: 100% Curated Inventory Resolved!');
  }
}

runAudit();
