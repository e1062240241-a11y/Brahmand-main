const fs = require('fs');
const filePath = 'frontend/app/(tabs)/legacy_index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /<FlatList\s+data=\{communities\}/g,
  `<FlatList
            data={communities}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}`
);

content = content.replace(
  /<FlatList\s+data=\{requests\}/g,
  `<FlatList
          data={requests}
          initialNumToRender={5}
          maxToRenderPerBatch={3}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}`
);

fs.writeFileSync(filePath, content);
console.log('patched');
