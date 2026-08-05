#!/bin/bash
set -e

FIREBASE_URL="https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/279.pdf?alt=media&token=410da0d2-bddf-4a43-8c58-ffa27b2bae74"
BACKEND_URL="https://brahmand-backend-hi4rz6fdrq-uc.a.run.app/api/library/books/bhagvad-geeta/pdf"

echo "=== FIREBASE HEAD (brahmand.app) ==="
curl -I -H "Origin: https://brahmand.app" "$FIREBASE_URL" | grep -iE "^HTTP|Access-Control-Allow-Origin|Access-Control-Expose-Headers|Content-Type|Content-Length|Accept-Ranges"

echo "\n=== FIREBASE RANGE 0-1023 (brahmand.app) ==="
curl -sS -D - -o /dev/null -H "Origin: https://brahmand.app" -H "Range: bytes=0-1023" "$FIREBASE_URL" | grep -iE "^HTTP|Access-Control-Allow-Origin|Content-Range|Content-Type|Accept-Ranges|Content-Length"

echo "\n=== BACKEND RANGE 0-1023 (brahmand.app) ==="
curl -sS -D - -o /dev/null -H "Origin: https://brahmand.app" -H "Range: bytes=0-1023" "$BACKEND_URL" | grep -iE "^HTTP|Access-Control-Allow-Origin|Content-Range|Content-Type|Accept-Ranges|Content-Length"

echo "\n=== BACKEND FULL GET (brahmand.app) ==="
curl -sS -D - -o /dev/null -H "Origin: https://brahmand.app" "$BACKEND_URL" || true
