import re

with open('app/(tabs)/home.tsx', 'r') as f:
    content = f.read()

# Replace all conflicts with the incoming version
new_content = re.sub(r'<<<<<<< HEAD.*?=======\n(.*?)\n>>>>>>> [a-f0-9]+', r'\1', content, flags=re.DOTALL)

with open('app/(tabs)/home.tsx', 'w') as f:
    f.write(new_content)

print("Conflicts resolved.")
