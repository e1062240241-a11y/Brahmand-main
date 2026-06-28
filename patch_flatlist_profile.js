const fs = require('fs');
const filePath = 'frontend/app/(tabs)/profile.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /<FlatList\s+ref=\{postListRef\}\s+data=\{posts\}/g,
  `<FlatList
              ref={postListRef}
              data={posts}
              initialNumToRender={5}
              maxToRenderPerBatch={3}
              windowSize={5}
              removeClippedSubviews={Platform.OS === 'android'}`
);

content = content.replace(
  /<FlatList\s+data=\{parentComments\}\s+keyExtractor=\{\(item,\s*index\)\s*=>\s*item\.id\s*\|\|\s*String\(index\)\}/g,
  `<FlatList
                      data={parentComments}
                      keyExtractor={(item, index) => item.id || String(index)}
                      initialNumToRender={10}
                      maxToRenderPerBatch={5}
                      windowSize={5}
                      removeClippedSubviews={Platform.OS === 'android'}`
);

fs.writeFileSync(filePath, content);
console.log('patched');
