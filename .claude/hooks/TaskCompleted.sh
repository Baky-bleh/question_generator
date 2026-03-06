#!/usr/bin/env bash
# .claude/hooks/TaskCompleted.sh
# Runs when a teammate marks a task as complete.
# Purpose: Lightweight validation that work meets standards.
# Exit code 2 = send feedback and keep teammate working.

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# ── Check: Were tests added? ───────────────────────────────────
# Look for test files modified in the last commit
recent_test_files=$(git diff --name-only HEAD~1 2>/dev/null | grep -c "test_" || echo "0")
recent_src_files=$(git diff --name-only HEAD~1 2>/dev/null | grep -cE "^(api/src|mobile/src|web/src)/" || echo "0")

if [ "$recent_src_files" -gt 0 ] && [ "$recent_test_files" -eq 0 ]; then
  echo "⚠️  You modified source files but added no tests."
  echo "   Convention: Write tests alongside implementation."
  echo "   Please add tests before marking this task complete."
  exit 2  # Keeps teammate working
fi

# ── Check: Were type hints added? (Python) ─────────────────────
py_files_changed=$(git diff --name-only HEAD~1 2>/dev/null | grep "\.py$" || true)
if [ -n "$py_files_changed" ]; then
  for f in $py_files_changed; do
    if [ -f "$PROJECT_ROOT/$f" ]; then
      # Check for functions missing type hints (rough check)
      untyped=$(grep -cP "def \w+\([^)]*\):" "$PROJECT_ROOT/$f" 2>/dev/null | head -1 || echo "0")
      typed=$(grep -cP "def \w+\([^)]*\)\s*->" "$PROJECT_ROOT/$f" 2>/dev/null | head -1 || echo "0")
      if [ "$untyped" -gt "$typed" ] && [ "$untyped" -gt 0 ]; then
        echo "⚠️  $f may have functions without return type hints."
        echo "   Convention: All functions must have type hints."
      fi
    fi
  done
fi

# ── Check: CHANGELOG_ENTRY for API/schema changes ──────────────
api_changes=$(git diff --name-only HEAD~1 2>/dev/null | grep -cE "(router|models|schemas)\.py$" || echo "0")
if [ "$api_changes" -gt 0 ]; then
  has_changelog=$(git log -1 --format="%B" 2>/dev/null | grep -c "CHANGELOG_ENTRY" || echo "0")
  if [ "$has_changelog" -eq 0 ]; then
    echo "⚠️  You changed API routes or models but didn't include a CHANGELOG_ENTRY."
    echo "   Add this to your commit message so docs stay current:"
    echo "   CHANGELOG_ENTRY: <describe what changed>"
  fi
fi

echo "✅ Task completion checks passed."
exit 0
