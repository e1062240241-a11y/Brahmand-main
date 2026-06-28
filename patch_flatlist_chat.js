const fs = require('fs');
const filePath = 'frontend/app/chat/[type]/[id].tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /<FlatList\s+ref=\{flatListRef\}\s+data=\{messages\}/g,
  `<FlatList
          ref={flatListRef}
          data={messages}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}`
);

fs.writeFileSync(filePath, content);
console.log('patched');
