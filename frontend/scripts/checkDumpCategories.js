const fs = require('fs');
const path = require('path');

const dumpPath = path.join(__dirname, '../src/constants/templeDataDump.json');
const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));

console.log(`Total dump records: ${dump.length}`);

const categories = {};
for (const t of dump) {
  const cat = t.category || 'Uncategorized';
  categories[cat] = (categories[cat] || 0) + 1;
}

console.log('Categories in dump:', categories);
