import glob
import re

files = glob.glob("frontend/app/library/*.tsx")

for filepath in files:
    if "continue-reading" in filepath or "sacred-scriptures" in filepath or "featured" in filepath or "index" in filepath:
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()

    # Add isReadyToSaveRef right after initializedReaderChapterRef
    if "isReadyToSaveRef" not in content:
        content = content.replace(
            "const initializedReaderChapterRef = useRef<number | null>(null);",
            "const initializedReaderChapterRef = useRef<number | null>(null);\n  const isReadyToSaveRef = useRef(false);"
        )

    # Set it to true after loadReaderState finishes
    if "isReadyToSaveRef.current = true" not in content:
        content = content.replace(
            "setBookmarkSpread(bookmarkIndex !== null ? base + bookmarkIndex : null);",
            "setBookmarkSpread(bookmarkIndex !== null ? base + bookmarkIndex : null);\n      setTimeout(() => { isReadyToSaveRef.current = true; }, 100);"
        )
        content = content.replace(
            "setSpreadIndex(targetSpread);",
            "setSpreadIndex(targetSpread);\n        setTimeout(() => { isReadyToSaveRef.current = true; }, 100);"
        )

    # Only save if isReadyToSaveRef is true
    if "!isReadyToSaveRef.current" not in content:
        content = content.replace(
            "if (pages.length === 0) return;",
            "if (pages.length === 0 || !isReadyToSaveRef.current) return;"
        )

    with open(filepath, 'w') as f:
        f.write(content)

print("Fixed race condition in all reader screens.")
