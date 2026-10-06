#!/bin/bash
set -e

FILE="index.html"
cp "$FILE" "$FILE.bak.syntaxfix"

python3 - <<'PY'
with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

# Find any line that triggers "Invalid escape in identifier"
# These are lines with a stray backslash NOT inside a string.
# Heuristic: line contains `installed — \` or `installed — ` followed by `\(`
bad_indices = []
for i, line in enumerate(lines):
    # Look for the corrupted KaTeX log line inside index.html
    if 'apex-katex-fix' in line and ('console.log' in line or 'installed' in line):
        bad_indices.append(i)

if not bad_indices:
    print("  No corrupted KaTeX log lines found in index.html")
else:
    print(f"  Found {len(bad_indices)} corrupted line(s):")
    for i in bad_indices:
        print(f"    line {i+1}: {lines[i].rstrip()[:100]}")
    # Replace each with a clean version
    for i in bad_indices:
        indent = len(lines[i]) - len(lines[i].lstrip())
        lines[i] = ' ' * indent + "console.log('[apex-katex-fix] installed');\n"
    with open('index.html', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(f"  Replaced {len(bad_indices)} corrupted line(s) with clean console.log")
PY

# Verify no more invalid escapes
echo ""
echo "  Checking for stray backslash identifiers..."
python3 - <<'PY'
import re
with open('index.html', encoding='utf-8') as f:
    html = f.read()

# Count every inline <script> and try to syntax-check it
import re
script_blocks = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.DOTALL)
print(f"  Found {len(script_blocks)} inline script block(s)")
for i, block in enumerate(script_blocks):
    if len(block.strip()) < 100:
        continue
    # Look for the specific pattern: a bare backslash before an identifier
    if re.search(r"[^\\'\"`/]\\(?![\\'\"nrtbvf0xu/])", block):
        # narrow it down to likely problem lines
        for j, line in enumerate(block.split('\n'), 1):
            if re.search(r"(?<!['\"/])\\(?!['\"nrtbvf0xu\\\\/])", line) and 'console.log' in line:
                print(f"    possible issue in inline block {i}, line {j}: {line.strip()[:100]}")
PY

echo ""
echo "  ✓ Done. Reload with ⌘⇧R"
