#!/bin/bash
# ============================================================
# APEX — fix HTML linter false positives
# Root causes:
#   1. CSS `content:"{"` and `content:"}"` inside <style> tags
#      confuses VS Code's HTML linter.
#   2. A stray `}` inside a JS string on ~Ln 11392 that cascades
#      into the CSS parser below it.
# Strategy:
#   1. Back up index.html.
#   2. Replace content:"{" / content:"}" with unicode escapes
#      (\007B / \007D) that render identically but lint cleanly.
#   3. Report any remaining odd-quote lines to fix by hand.
# ============================================================

set -e

FILE="index.html"

if [ ! -f "$FILE" ]; then
  echo "✗ $FILE not found. Run this from ExamOS-Backup/."
  exit 1
fi

echo "→ Backing up to index.html.bak.$(date +%s)"
cp "$FILE" "index.html.bak.$(date +%s)"

echo "→ Replacing literal brace content strings with unicode escapes"
# These render exactly the same in every browser:
#   \007B  →  {
#   \007D  →  }
# Using the escape form avoids the HTML linter mistaking the
# brace for the end of a CSS rule.

# macOS-friendly sed (BSD). On Linux drop the '' after -i.
sed -i '' \
  -e 's/content:"{"/content:"\\007B"/g' \
  -e "s/content:'{'/content:'\\\\007B'/g" \
  -e 's/content:"}"/content:"\\007D"/g' \
  -e "s/content:'}'/content:'\\\\007D'/g" \
  "$FILE"

echo "→ Scanning for unquoted-brace CSS mistakes"
grep -n 'content: *[{}][^"]' "$FILE" || echo "  none found"

echo "→ Scanning for JS lines with odd quote counts (likely truncation)"
awk '
  /<script/ { inscript=1 }
  /<\/script>/ { inscript=0 }
  inscript && NR > 11000 && NR < 12000 {
    n = gsub(/"/, "&")
    if (n % 2 == 1) print NR": "$0
  }
' "$FILE" | head -20 || true

echo ""
echo "✓ Done. Reload VS Code (⌘⇧P → Developer: Reload Window)."
echo "  If red squiggles remain, create .vscode/settings.json with:"
echo '    { "html.validate.scripts": false, "html.validate.styles": false }'
echo "  That silences the linter for embedded blocks without touching your code."
