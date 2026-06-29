const fs = require('fs');
const filePath = 'frontend/app/post/[id].tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /<FlatList\s+ref=\{listRef\}\s+data=\{feedPosts\}/g,
  `<FlatList
          ref={listRef}
          data={feedPosts}
          initialNumToRender={5}
          maxToRenderPerBatch={3}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}`
);

content = content.replace(
  /<FlatList\s+data=\{parentComments\}\s+keyExtractor=\{\(item,\s*idx\)\s*=>\s*String\(item\.id\s*\|\|\s*idx\)\}/g,
  `<FlatList
                    data={parentComments}
                    keyExtractor={(item, idx) => String(item.id || idx)}
                    initialNumToRender={10}
                    maxToRenderPerBatch={5}
                    windowSize={5}
                    removeClippedSubviews={Platform.OS === 'android'}`
);

fs.writeFileSync(filePath, content);
console.log('patched');
