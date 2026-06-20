const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Find the exact text inserted which might cause JSX syntax error
  const search = `{/* ⚡ Bolt: Added FlatList performance props - Reduces memory usage and improves scroll performance on Android */}
                  <FlatList`;

  const replace = `<>
                  {/* ⚡ Bolt: Added FlatList performance props - Reduces memory usage and improves scroll performance on Android */}
                  <FlatList`;

  const search2 = `removeClippedSubviews={Platform.OS === 'android'}
                    renderItem`;
  const replace2 = `removeClippedSubviews={Platform.OS === 'android'}
                    renderItem`;

  // Actually, we don't need <> if the comment is inside curly braces or just outside in a valid JSX spot, but since the parent is `return ( ... )` which expects a single root element, adding the comment before FlatList makes it multiple children. We need a fragment!

  // Let's replace the block properly.
  content = content.replace(`{/* ⚡ Bolt: Added FlatList performance props - Reduces memory usage and improves scroll performance on Android */}
                  <FlatList`, `<>
                  {/* ⚡ Bolt: Added FlatList performance props - Reduces memory usage and improves scroll performance on Android */}
                  <FlatList`);

  content = content.replace(/removeClippedSubviews=\{Platform\.OS === 'android'\}([\s\S]*?)<\/FlatList>/g, (match) => {
      if (!match.includes('</>')) {
        return match + '\n                  </>';
      }
      return match;
  });

  fs.writeFileSync(file, content);
}

fixFile('frontend/app/(tabs)/home.tsx');
fixFile('frontend/src/components/ReelViewer.tsx');
console.log('Fixed syntax');
