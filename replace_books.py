import os

books = {
    'atharvaved': ('Atharvaved', '../../assets/images/tab bar/books/Atharveda.png'),
    'mahabharata': ('Mahabharata', '../../assets/images/tab bar/books/Mahabharat.png'),
    'ramayan': ('Ramayan', '../../assets/images/tab bar/books/Ramayana.png'),
    'upanishads': ('Upanishads', '../../assets/images/tab bar/books/926fcc275fe2d574ed7190b15962fd9a469f7d8f.png'), # Assuming this is Upanishads
    'rigveda': ('Rigveda', '../../assets/images/tab bar/books/Rigveda.png'),
    'yajurveda': ('Yajurveda', '../../assets/images/tab bar/books/Yujurveda.png'),
    'ramcharitmanas': ('Ramcharitmanas', '../../assets/images/tab bar/books/ramcharit.png'),
}

for filename, (title, img_path) in books.items():
    filepath = f"frontend/app/library/{filename}.tsx"
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    # Replace the image require
    import re
    content = re.sub(
        r"const geeta3DImage = require\('[^']+'\);",
        f"const geeta3DImage = require('{img_path}');",
        content
    )
    
    # Replace the title "Bhagavad Gita" with the actual title
    content = content.replace('title = "Bhagavad Gita"', f'title = "{title}"')
    content = content.replace('Bhagavad Gita', title)
    
    # Write back
    with open(filepath, 'w') as f:
        f.write(content)

print("Done")
