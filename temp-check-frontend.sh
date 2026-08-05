#!/bin/bash
set -e
URL="https://brahmand-frontend-hi4rz6fdrq-uc.a.run.app"
echo "=== FRONTEND STATUS ==="
curl -I -L -s "$URL" | grep -i '^HTTP'
echo "\n=== FRONTEND CONTENT PDF URL MATCH ==="
curl -L -s "$URL" | python3 - <<'PY'
import re, sys
text = sys.stdin.read()
for m in re.finditer(r'https://firebasestorage\.googleapis\.com/v0/b/sanatan-lok\.firebasestorage\.app/o/279\.pdf\?alt=media&token=[^"\s]+', text):
    print(m.group(0))
PY
