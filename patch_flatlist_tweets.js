const fs = require('fs');
const filePath = 'frontend/app/community-tweets.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /<FlatList\s+data=\{displayData\}/g,
  `<FlatList
      data={displayData}
      initialNumToRender={5}
      maxToRenderPerBatch={3}
      windowSize={5}
      removeClippedSubviews={Platform.OS === 'android'}`
);

fs.writeFileSync(filePath, content);
console.log('patched');
