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
} from '../src/data/jyotirlingaTravelData';

console.log("=== COMPONENT RENDER SAFETY TEST FOR PILGRIMAGE TRAVEL SECTION ===");

// Representative data shapes from Bucket A & Bucket B
const testTemples = [
  { id: 'DtRMUCBaXR9V5Gjfo2KB', name: 'Belur Math – Howrah', category: 'Sacred Ashram' },
  { id: 'rehYeVTegfhKQcTJHgzV', name: 'Vaitheeswaran Koil – Mayiladuthurai', category: 'Navagraha Temple' },
  { id: 'ADNI907Vtd4sTM4SMSlg', name: 'Sri Aurobindo Ashram – Puducherry', category: 'Ashram' },
  { id: 'ReODA2z7UzfWQrpf00tO', name: 'Dhyanalinga & Isha Yoga Center', category: 'Healing Center' },
  { id: 'fxc1tNXmKvBSZvf3kU9b', name: 'Anandamayi Ma Ashram – Haridwar', category: 'Ashram' },
  { id: 'yilhdofmFA2wscBqioSF', name: 'Kedarnath Temple', category: 'Jyotirlinga' },
  { id: '5vawXjLGFdM16y0JdIlE', name: 'Vaishno Devi Temple – Jammu & Kashmir', category: 'Shakti Peeth' },
  { id: 'BJFpcnGkTngxwgw1fQsO', name: 'Golden Temple – Amritsar', category: 'Sacred Shrine' },
  { id: '0HFpwT5bhKt6Ei8F0hFA', name: 'Jagannath Temple – Puri', category: 'Char Dham' },
  { id: 'bPsW9fUrJf4eH4Tke319', name: 'Ballaleshwar Temple – Pali', category: 'Ashtavinayak' },
];

let renderPassCount = 0;

for (const t of testTemples) {
  const data = getExploreNearbyData(t.id, t.name, t.category);

  if (!data.hasCuratedData) {
    console.error(`❌ FAILS: Expected curated data for "${t.name}" (${t.id}), but got hasCuratedData: false`);
    continue;
  }

  const sacredCount = data.nearbySacredPlaces?.length || 0;
  const nearbyCount = data.nearbyTemples?.length || 0;

  if (sacredCount === 0 && nearbyCount === 0) {
    console.error(`❌ FAILS: Data reported hasCuratedData: true but both sacredPlaces and nearbyTemples are empty for "${t.name}"`);
    continue;
  }

  console.log(`✅ PASS: [${t.category}] "${t.name}" -> ${sacredCount} Sacred Places, ${nearbyCount} Nearby Temples`);
  renderPassCount++;
}

console.log(`\nResults: ${renderPassCount}/${testTemples.length} sampled temples PASSED rendering verification!`);
