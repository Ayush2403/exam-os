#!/usr/bin/env python3
"""Regenerate the APEX audit bundle from the current working directory.
Run: python3 build-bundle.py
Output: APEX-AUDIT-BUNDLE.txt
"""

import os
import sys
import subprocess
import datetime

OUTPUT = 'APEX-AUDIT-BUNDLE.txt'

# Curated list — code only. Add new files here when you create them.
FILES = [
    # Core
    'index.html',
    'landing.html',
    # Sync + service worker
    'sync.js',
    'sw.js',
    # Configuration / intelligence
    'exam-config.js',
    'exam-weightage.js',
    # Patches (in load order)
    'apex-a11y.js',
    'apex-keys.js',
    'apex-final.js',
    'apex-final-batch.js',
    'apex-leech-topic.js',
    'apex-polish.js',
    'apex-tag-fix.js',
    'apex-new-exam.js',
    'apex-tags-final.js',
    'apex-syl-focus.js',
    'apex-syl-scroll.js',
    'apex-scope.js',
    'apex-task-rollover.js',
    'apex-obsidian-link.js',
    'apex-katex-fix.js',
    'apex-theme-fix.js',
    'apex-exam-sync.js',
    'apex-focus-notes-edit.js',
    'apex-focus-history-edit.js',
    'apex-scroll-preserve.js',
    'apex-mobile.js',
    # Stylesheets
    'apex-layout-fix.css',
    'apex-mobile-ux.css',
    'apex-desktop-polish.css',
    # Project metadata
    'manifest.json',
    'README.md',
    'schema.sql',
    'wrangler.toml',
]


def run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL).decode('utf-8').strip()
    except Exception:
        return ''


def main():
    if not os.path.exists('index.html'):
        print("[error] index.html not found. Run this from the project root.")
        sys.exit(1)

    # Capture git provenance
    commit = run('git rev-parse --short HEAD')
    branch = run('git rev-parse --abbrev-ref HEAD')
    commit_msg = run('git log -1 --pretty=%s')
    dirty = run('git status --porcelain')

    found = []
    missing = []

    with open(OUTPUT, 'w', encoding='utf-8') as out:
        # Header
        out.write("=" * 78 + "\n")
        out.write("APEX — FULL CODE BUNDLE FOR AUDIT\n")
        out.write("Generated: " + datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "\n")
        if commit:
            out.write(f"Branch:    {branch}\n")
            out.write(f"Commit:    {commit}  {commit_msg}\n")
            if dirty:
                out.write("State:     DIRTY (uncommitted changes present)\n")
            else:
                out.write("State:     clean\n")
        out.write("=" * 78 + "\n\n")

        # File count preview
        out.write("FILES INCLUDED\n")
        out.write("-" * 78 + "\n")
        for fname in FILES:
            if os.path.exists(fname):
                size = os.path.getsize(fname)
                out.write(f"  {fname:<45} {size:>10,} bytes\n")
        out.write("\n")

        # Files
        for fname in FILES:
            if not os.path.exists(fname):
                missing.append(fname)
                continue
            found.append(fname)
            try:
                with open(fname, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
            except Exception as e:
                print(f"[error] reading {fname}: {e}")
                continue

            size = os.path.getsize(fname)
            line_count = content.count('\n') + 1

            out.write("\n" + "=" * 78 + "\n")
            out.write(f"FILE: {fname}\n")
            out.write(f"SIZE: {size:,} bytes · {line_count:,} lines\n")
            out.write("=" * 78 + "\n\n")
            out.write(content)
            out.write(f"\n\n--- END {fname} ---\n")

        out.write("\n" + "=" * 78 + "\n")
        out.write("END OF BUNDLE\n")
        out.write("=" * 78 + "\n")

    total_size = os.path.getsize(OUTPUT)
    print(f"[done] bundle written to {OUTPUT}")
    print(f"       {len(found)} files · {total_size:,} bytes")
    if missing:
        print(f"[warn] not found: {', '.join(missing)}")
    if commit:
        print(f"       git: {branch} @ {commit}")


if __name__ == '__main__':
    main()
