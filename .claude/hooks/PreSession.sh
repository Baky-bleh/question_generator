#!/usr/bin/env bash
# .claude/hooks/PreSession.sh
# Runs before any Claude Code session starts.
# Purpose: Ensure documentation exists and warn if stale.

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
DOCS_DIR="$PROJECT_ROOT/docs"
STATUS_FILE="$DOCS_DIR/phase-status.md"

# ── Check that core docs exist ──────────────────────────────────
required_docs=(
  "architecture.md"
  "conventions.md"
  "api-contracts.md"
  "database-schema.md"
  "phase-status.md"
  "agent-teams.md"
  "decisions.md"
)

missing=()
for doc in "${required_docs[@]}"; do
  if [ ! -f "$DOCS_DIR/$doc" ]; then
    missing+=("$doc")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "⚠️  MISSING DOCUMENTATION FILES:"
  printf '   - docs/%s\n' "${missing[@]}"
  echo "   Run doc-sync agent or create these files before proceeding."
  exit 2  # Exit code 2 sends feedback to agent
fi

# ── Check doc freshness ─────────────────────────────────────────
# Compare last doc update vs last code change
last_doc_commit=$(git log -1 --format="%ct" -- docs/ 2>/dev/null || echo "0")
last_code_commit=$(git log -1 --format="%ct" -- api/src/ mobile/src/ web/src/ 2>/dev/null || echo "0")

if [ "$last_code_commit" -gt "$last_doc_commit" ] && [ "$last_doc_commit" != "0" ]; then
  stale_hours=$(( (last_code_commit - last_doc_commit) / 3600 ))
  if [ "$stale_hours" -gt 24 ]; then
    echo "⚠️  DOCS MAY BE STALE"
    echo "   Last code change: $(git log -1 --format='%ar' -- api/src/ mobile/src/ web/src/)"
    echo "   Last doc update:  $(git log -1 --format='%ar' -- docs/)"
    echo "   Consider running doc-sync agent before starting new work."
    echo ""
  fi
fi

# ── Print current phase status ──────────────────────────────────
if [ -f "$STATUS_FILE" ]; then
  current_phase=$(grep "^## Current Phase:" "$STATUS_FILE" | head -1 || echo "Unknown")
  echo "📋 $current_phase"
  echo "   Read docs/phase-status.md for full context."
  echo ""
fi

# ── Remind about file ownership ─────────────────────────────────
echo "📁 Remember: Only edit files in your assigned directories."
echo "   Read CLAUDE.md → docs/conventions.md for rules."
echo ""

exit 0
