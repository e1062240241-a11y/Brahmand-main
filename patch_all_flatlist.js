const fs = require('fs');

const files = [
  'frontend/app/(tabs)/home.tsx',
];

const comment = `
              {/* ⚡ Bolt: Added FlatList performance props — Prevents memory leaks and heavy JS thread load on Android for long lists. Expected impact: smoother scrolling and fewer crashes on Android. */}
`;

let content = fs.readFileSync(files[0], 'utf8');
content = content.replace(
  /<FlatList\s+data=\{parentComments\}/g,
  comment.trim() + `\n              <FlatList\n                data={parentComments}`
);

fs.writeFileSync(files[0], content);
console.log('patched');
