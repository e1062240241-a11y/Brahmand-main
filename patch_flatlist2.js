const fs = require('fs');
const file = 'frontend/src/components/ReelViewer.tsx';
let content = fs.readFileSync(file, 'utf8');

const search = `<FlatList
                    data={parentComments}
                    keyExtractor={(item) => item.id || \`\${item.user_id}-\${item.created_at}\`}`;

const replace = `{/* ⚡ Bolt: Added FlatList performance props - Reduces memory usage and improves scroll performance on Android */}
                  <FlatList
                    data={parentComments}
                    keyExtractor={(item) => item.id || \`\${item.user_id}-\${item.created_at}\`}
                    initialNumToRender={10}
                    maxToRenderPerBatch={5}
                    windowSize={5}
                    removeClippedSubviews={Platform.OS === 'android'}`;

content = content.replace(search, replace);
fs.writeFileSync(file, content);
console.log('Done');
