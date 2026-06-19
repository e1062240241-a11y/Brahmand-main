import os
import re

frontend_dir = "/Users/Developer/Desktop/Brahmand-main/frontend"
dirs_to_search = ["app", "src"]

results = []

for folder in dirs_to_search:
    full_folder_path = os.path.join(frontend_dir, folder)
    if not os.path.exists(full_folder_path):
        continue
    for root, dirs, files in os.walk(full_folder_path):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', 'dist', 'build')]
        for file in files:
            if file.endswith((".ts", ".tsx", ".js", ".jsx")):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, "r") as f:
                        lines = f.readlines()
                    for idx, line in enumerate(lines):
                        if "Platform" in line and ("ios" in line.lower() or "android" in line.lower()):
                            rel_path = os.path.relpath(filepath, frontend_dir)
                            results.append(f"{rel_path}:{idx + 1}: {line.strip()}")
                except Exception as e:
                    pass

output_path = os.path.join(frontend_dir, "scripts/platform_checks.txt")
with open(output_path, "w") as f:
    f.write(f"Found {len(results)} mobile-specific platform checks:\n")
    f.write("\n".join(results))

print(f"Written results to {output_path}")
