import os
import re

files = {
    'bhagavad-gita-3d': 'bhagvad-geeta',
    'atharvaved': 'atharvaved',
    'mahabharata': 'mahabharata',
    'ramayan': 'ramayan',
    'upanishads': 'upanishads',
    'rigveda': 'rigveda',
    'yajurveda': 'yajurveda',
    'ramcharitmanas': 'ramcharitmanas',
}

for filename, book_id in files.items():
    filepath = f"frontend/app/library/{filename}.tsx"
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    # Check if we already imported libraryStore
    if 'useLibraryStore' not in content:
        content = content.replace("import { useGitaStore }", "import { useGitaStore } from '../../src/store/gitaStore';\nimport { useLibraryStore } from '../../src/store/libraryStore';\n//")
        
    if 'const { updateProgress }' not in content:
        content = content.replace("const { lastReadChapter", "const { updateProgress } = useLibraryStore();\n  const { lastReadChapter")
        
    # Inject library update into handleScroll
    # Find setLastRead(currentChapter, scrollY, clampedProgress);
    if 'updateProgress({' not in content:
        update_code = f"""
    setLastRead(currentChapter, scrollY, clampedProgress);
    
    // Update Library Store
    updateProgress({{
      id: '{book_id}',
      chapterName: GITA_DATA[currentChapter]?.title || `अध्याय ${{currentChapter}}`,
      chapterNum: currentChapter,
      lastReadPage: Math.max(1, Math.min(Math.ceil(contentHeight / (layoutHeight || 1)), Math.ceil((clampedProgress / 100) * Math.max(1, Math.ceil(contentHeight / (layoutHeight || 1)) - 1)) + 1)),
      totalPages: Math.max(1, Math.ceil(contentHeight / (layoutHeight || 1))),
      progressPercent: clampedProgress,
      lastOpenedTime: Date.now(),
    }});
"""
        content = content.replace("setLastRead(currentChapter, scrollY, clampedProgress);", update_code)

    with open(filepath, 'w') as f:
        f.write(content)

print("Fixed library store progress updates")
