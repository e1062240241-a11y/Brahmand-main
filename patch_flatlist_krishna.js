const fs = require('fs');
const filePath = 'frontend/app/my-krishna.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /<FlatList\s+ref=\{flatListRef\}\s+data=\{messages\}/g,
  `<FlatList
              ref={flatListRef}
              data={messages}
              initialNumToRender={10}
              maxToRenderPerBatch={5}
              windowSize={5}
              removeClippedSubviews={Platform.OS === 'android'}`
);

fs.writeFileSync(filePath, content);
console.log('patched');
