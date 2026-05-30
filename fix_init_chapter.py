import os
import glob
import re

files = glob.glob("frontend/app/library/*.tsx")

for filepath in files:
    if "continue-reading" in filepath or "sacred-scriptures" in filepath or "featured" in filepath or "index" in filepath:
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    # We want to replace loadChapter(1) inside the useEffect
    # Wait, retryInitialLoad also has loadChapter(1).
    # And there's chapters[1]?.length
    
    # We can carefully use regex or string replace.
    # Because chapterNum is in scope for all of these!
    
    # Replace await loadChapter(1); -> await loadChapter(chapterNum);
    content = content.replace('await loadChapter(1);', 'await loadChapter(chapterNum);')
    
    # Replace chapters[1]?.length -> chapters[chapterNum]?.length
    content = content.replace('chapters[1]?.length', 'chapters[chapterNum]?.length')
    
    # Replace delete next[1]; -> delete next[chapterNum];
    content = content.replace('delete next[1];', 'delete next[chapterNum];')
    
    # Replace loadChapter(1); -> loadChapter(chapterNum);
    content = content.replace('void loadChapter(1);', 'void loadChapter(chapterNum);')
    
    # Replace 'Chapter 1 is taking too long -> `Chapter ${chapterNum} is taking too long
    # Same for Kaanda 1
    content = re.sub(r"'([^']*) 1 is taking too long to load([^']*)'", r"`\1 ${chapterNum} is taking too long to load\2`", content)
    
    # Also in BookLayout we might have setSpreadIndex(0) but BookLayout takes care of going to initialSpread!
    # Wait, the initial load useEffect sets setSpreadIndex(0) before loading! 
    # But then loadReaderState triggers when pages > 0, which overrides it!
    # So setSpreadIndex(0) is fine as a placeholder.

    with open(filepath, 'w') as f:
        f.write(content)

print("Updated all reader files.")
