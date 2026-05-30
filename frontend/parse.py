content = open("app/(tabs)/home.tsx").read()
lines = content.split('\n')
for i, line in enumerate(lines):
    if "{!(loadingFeed && feedPosts.length === 0) && (" in line:
        print(f"Line {i+1}: {line}")
