#!/usr/bin/env bash
# .claude/hooks/PostSession.sh
# Runs after a Claude Code session ends.
# Purpose: Collect CHANGELOG_ENTRYs from recent commits and stage for doc-sync.

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CHANGELOG_DIR="$PROJECT_ROOT/.claude/changelogs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$CHANGELOG_DIR"

# ── Extract CHANGELOG_ENTRY from recent commits ────────────────
# Look at commits since the last doc-sync
last_sync_tag=$(git tag -l "doc-sync-*" --sort=-creatordate | head -1 2>/dev/null || echo "")

if [ -n "$last_sync_tag" ]; then
  range="${last_sync_tag}..HEAD"
else
  range="HEAD~20..HEAD"  # fallback: last 20 commits
fi

# Extract CHANGELOG_ENTRY blocks from commit messages
entries=$(git log "$range" --format="%B" 2>/dev/null | grep -A 5 "CHANGELOG_ENTRY:" || true)

if [ -n "$entries" ]; then
  echo "$entries" > "$CHANGELOG_DIR/session_${TIMESTAMP}.txt"
  echo "📝 Collected CHANGELOG_ENTRYs from recent commits."
  echo "   Saved to .claude/changelogs/session_${TIMESTAMP}.txt"
  echo ""
  echo "   Run doc-sync agent to incorporate these into docs:"
  echo "   'Spawn a doc-sync teammate to update documentation from changelogs and codebase.'"
else
  echo "ℹ️  No CHANGELOG_ENTRY found in recent commits."
  echo "   If you made API or schema changes, add CHANGELOG_ENTRY to your commit messages."
fi

# ── Run basic validation ────────────────────────────────────────
echo ""
echo "── Post-Session Checks ──"

# Check if any tests were broken
if [ -f "$PROJECT_ROOT/api/pyproject.toml" ]; then
  cd "$PROJECT_ROOT/api"
  if command -v pytest &> /dev/null; then
    echo "🧪 Running quick test check..."
    if pytest --co -q 2>/dev/null | tail -1 | grep -q "no tests"; then
      echo "   ⚠️  No tests found. Did you forget to write tests?"
    else
      test_count=$(pytest --co -q 2>/dev/null | tail -1 | grep -oP '\d+' | head -1 || echo "?")
      echo "   ✅ ${test_count} tests collected."
    fi
  fi
fi

# Check for uncommitted changes
cd "$PROJECT_ROOT"
uncommitted=$(git status --porcelain 2>/dev/null | wc -l || echo "0")
if [ "$uncommitted" -gt 0 ]; then
  echo "   ⚠️  ${uncommitted} uncommitted files. Remember to commit your work."
fi

echo ""
exit 0
