const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Revert all previous modifications
  content = content.replace(/<>[\s]*{\/\* ⚡ Bolt: Added FlatList performance props - Reduces memory usage and improves scroll performance on Android \*\/}[\s]*<FlatList/g, `<FlatList`);
  content = content.replace(/{\/\* ⚡ Bolt: Added FlatList performance props - Reduces memory usage and improves scroll performance on Android \*\/}[\s]*<FlatList/g, `<FlatList`);

  content = content.replace(/initialNumToRender=\{10\}[\s]*maxToRenderPerBatch=\{5\}[\s]*windowSize=\{5\}[\s]*removeClippedSubviews=\{Platform\.OS === 'android'\}/g, ``);
  content = content.replace(/<\/FlatList>[\s]*<\/>/g, `</FlatList>`);

  fs.writeFileSync(file, content);
}

fixFile('frontend/app/(tabs)/home.tsx');
fixFile('frontend/src/components/ReelViewer.tsx');
console.log('Fixed syntax phase 1');
