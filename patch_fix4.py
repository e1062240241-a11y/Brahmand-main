with open('frontend/src/components/PostFeedCard.tsx', 'r') as f:
    content = f.read()

# Add to type PostFeedCardProps
type_old = "type PostFeedCardProps = {"
type_new = "type PostFeedCardProps = {\n  distanceFromActive?: number;"
if type_old in content and "distanceFromActive?: number;" not in content:
    content = content.replace(type_old, type_new)

with open('frontend/src/components/PostFeedCard.tsx', 'w') as f:
    f.write(content)

with open('test_script.py', 'w') as f:
    f.write("""
with open('frontend/app/(tabs)/home.tsx', 'r') as f:
    home_content = f.read()

with open('frontend/src/components/PostFeedCard.tsx', 'r') as f:
    card_content = f.read()

assert 'distanceFromActive = Math.abs(index - activePostIndex)' in home_content, "Missing distanceFromActive calc in home.tsx"
assert 'distanceFromActive={distanceFromActive}' in home_content, "Missing prop pass in home.tsx"
assert 'const [activePostIndex, setActivePostIndex] = useState(0)' in home_content, "Missing state in home.tsx"
assert 'ESTIMATED_ITEM_SIZE' in home_content, "Missing ESTIMATED_ITEM_SIZE in home.tsx"
assert 'distanceFromActive?: number;' in card_content, "Missing prop interface in PostFeedCard.tsx"
assert 'prevProps.distanceFromActive === nextProps.distanceFromActive' in card_content, "Missing comparator check in PostFeedCard.tsx"
assert 'useMemo' in card_content, "Missing useMemo in PostFeedCard.tsx"
print("All passed!")
""")
