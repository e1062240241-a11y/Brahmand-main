import os
import re

def add_a11y_attributes(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find <TouchableOpacity ... > that doesn't have accessibilityRole
    pattern = re.compile(r'(<TouchableOpacity\b[^>]*)(>)', re.DOTALL)

    def replacer(match):
        tag_start = match.group(1)
        tag_end = match.group(2)

        # Don't modify if it already has accessibilityRole
        if 'accessibilityRole' in tag_start:
            return match.group(0)

        # Add accessibilityRole="button"
        label = "Button"
        if 'onPress' in tag_start:
            onpress_match = re.search(r'onPress=\{?([^}]+)\}?', tag_start)
            if onpress_match:
                # We need a robust way to extract the function name, we don't want to parse it as string. Let's just use generic "Button"
                label = "Button"

        # Only modify if it doesn't have accessibilityLabel either
        if 'accessibilityLabel' not in tag_start:
            new_tag = f'{tag_start} accessibilityRole="button" accessibilityLabel="{label}"{tag_end}'
        else:
            new_tag = f'{tag_start} accessibilityRole="button"{tag_end}'

        return new_tag

    new_content = pattern.sub(replacer, content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

def main():
    components_dir = "src/components"
    for root, _, files in os.walk(components_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                add_a11y_attributes(os.path.join(root, file))

if __name__ == "__main__":
    main()
