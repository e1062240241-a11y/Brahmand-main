const parser = require('@babel/parser');
const fs = require('fs');

const files = [
  'app/(tabs)/jaap.tsx',
  'app/(tabs)/temple.tsx',
  'app/(tabs)/_layout.tsx'
];

files.forEach(file => {
  try {
    const code = fs.readFileSync(file, 'utf8');
    parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
    console.log(`${file}: OK`);
  } catch (e) {
    console.log(`${file}: ERROR at ${e.loc.line}:${e.loc.column}`);
    console.log(e.message);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    console.log('Context:');
    console.log(lines[e.loc.line - 1]);
    console.log(' '.repeat(e.loc.column) + '^');
  }
});
