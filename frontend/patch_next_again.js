const fs = require('fs');
const file = '/Users/developer/Desktop/Brahmand-main/frontend/src/components/ReelViewer.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const handleNext = () => {\n        if (activeIndex < videos.length - 1) {\n          flatListRef.current?.scrollToIndex({\n            index: activeIndex + 1,\n            animated: true,\n          });\n        }\n      };',
  'const handleNext = () => {\n        if (activeIndex < videos.length - 1) {\n          flatListRef.current?.scrollToOffset({\n            offset: (activeIndex + 1) * SCREEN_HEIGHT,\n            animated: true,\n          });\n        }\n      };'
);

fs.writeFileSync(file, content);
