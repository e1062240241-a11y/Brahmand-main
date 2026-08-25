import os
import re

def grep_codebase(pattern):
    print(f"\n--- Checking {pattern} ---")
    os.system(f"grep -rnw '.' -e '{pattern}' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=venv --exclude-dir=.venv")

# Unused Exception variables - we won't touch these since they are exceptions and removing them could break functionality (memory rule)
# Actually, wait, the rules say "When acting as the 'Scythe' dead code hunter, strictly prioritize production-level safety by scoping PRs to easily verifiable, zero-risk changes (like unused imports). Avoid altering functional logic, such as shadowed variables, function redefinitions, or unused exception variables (e.g., except Exception as e:), as these carry a risk of breaking functionality."

# So I will just focus on ONE logical group of unused imports in the python backend!
