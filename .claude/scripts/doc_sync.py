#!/usr/bin/env python3
"""
doc_sync.py — Programmatic doc-sync using Claude Code SDK.

Run this after each phase completes to rewrite documentation
based on the actual codebase state.

Usage:
    python .claude/scripts/doc_sync.py                    # Full sync
    python .claude/scripts/doc_sync.py --phase 1          # Sync after specific phase
    python .claude/scripts/doc_sync.py --docs-only api    # Only sync api-contracts.md
    python .claude/scripts/doc_sync.py --dry-run           # Preview what would change

Requires: claude-code SDK (npm install -g @anthropic-ai/claude-code)
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DOCS_DIR = PROJECT_ROOT / "docs"
CHANGELOG_DIR = PROJECT_ROOT / ".claude" / "changelogs"


def collect_changelogs() -> str:
    """Collect all unprocessed changelog entries."""
    if not CHANGELOG_DIR.exists():
        return ""

    entries = []
    for f in sorted(CHANGELOG_DIR.glob("session_*.txt")):
        entries.append(f.read_text())

    return "\n".join(entries) if entries else ""


def get_git_context() -> str:
    """Get recent git activity for context."""
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", "-30", "--format=%h %s"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
        )
        return result.stdout.strip()
    except Exception:
        return "(git log unavailable)"


def get_file_tree(directory: str) -> str:
    """Get a tree of source files for a directory."""
    target = PROJECT_ROOT / directory
    if not target.exists():
        return f"({directory}/ does not exist yet)"

    try:
        result = subprocess.run(
            ["find", str(target), "-name", "*.py", "-o", "-name", "*.ts", "-o", "-name", "*.tsx"],
            capture_output=True,
            text=True,
        )
        files = [
            str(Path(f).relative_to(PROJECT_ROOT))
            for f in result.stdout.strip().split("\n")
            if f
        ]
        return "\n".join(sorted(files)) if files else f"({directory}/ has no source files)"
    except Exception:
        return f"(error scanning {directory}/)"


def build_sync_prompt(phase: int | None, docs_only: str | None) -> str:
    """Build the prompt for the doc-sync agent."""

    changelogs = collect_changelogs()
    git_context = get_git_context()

    # Determine which docs to update
    if docs_only == "api":
        doc_targets = "ONLY docs/api-contracts.md"
    elif docs_only == "schema":
        doc_targets = "ONLY docs/database-schema.md"
    elif docs_only == "status":
        doc_targets = "ONLY docs/phase-status.md"
    else:
        doc_targets = "ALL doc files: api-contracts.md, database-schema.md, phase-status.md, architecture.md"

    phase_context = f"Phase {phase} just completed." if phase else "General sync requested."

    prompt = f"""You are the documentation sync agent for the LinguaLeap project.

## Your Job
Read the ACTUAL codebase and REWRITE (not append to) the documentation files
so they accurately reflect what currently exists in the code.

## Critical Rules
- REWRITE each doc file completely. Do not append or patch.
- Document what EXISTS in code, not what was planned.
- If a planned feature wasn't built, mark it as "NOT IMPLEMENTED" in phase-status.md.
- If an unplanned feature was built, add it to the appropriate doc.
- Keep the same document structure and formatting conventions.
- Include the sync timestamp at the top of each file: "Last synced: [date] by doc-sync agent"

## Context
{phase_context}

### Recent Git Commits
{git_context}

### Changelog Entries (from agent sessions)
{changelogs if changelogs else "(No changelog entries found)"}

### Source Files in api/src/
{get_file_tree("api/src")}

### Source Files in mobile/src/
{get_file_tree("mobile/src")}

### Source Files in web/src/
{get_file_tree("web/src")}

## What To Update
{doc_targets}

## For api-contracts.md
- Open EVERY router file in api/src/
- List every @router decorated function with its method, path, request/response schemas
- Get request/response shapes from the actual Pydantic schemas in schemas.py files
- Do NOT copy from the old doc — read the code fresh

## For database-schema.md
- Open EVERY models.py file in api/src/
- List every SQLAlchemy model with its actual columns, types, constraints
- Check alembic/versions/ for the latest migration to confirm schema state

## For phase-status.md
- For each phase's deliverables, check if the code actually exists
- Mark as ✅ only if the feature is implemented AND has tests
- Mark as ⚠️ if implemented but no tests
- Mark as 🔲 if not started
- Update the Changelog table at the bottom

## For architecture.md
- Check if any new services or patterns were added
- Update service boundary table if new modules exist
- Update data flow if new external integrations were added

After updating, commit the changes with message:
"docs: sync documentation after phase completion [doc-sync]"

Then tag the commit: doc-sync-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}
"""
    return prompt


def run_claude_code(prompt: str, dry_run: bool = False) -> None:
    """Run Claude Code with the sync prompt."""

    if dry_run:
        print("=" * 60)
        print("DRY RUN — Would send this prompt to Claude Code:")
        print("=" * 60)
        print(prompt)
        print("=" * 60)
        return

    # Method 1: Using Claude Code CLI directly
    try:
        print("🔄 Starting doc-sync agent via Claude Code CLI...")
        result = subprocess.run(
            ["claude", "--print", "--dangerously-skip-permissions", "-p", prompt],
            cwd=PROJECT_ROOT,
            capture_output=False,
            text=True,
        )
        if result.returncode == 0:
            print("✅ Doc sync complete.")
            # Clean up processed changelogs
            cleanup_changelogs()
        else:
            print(f"❌ Doc sync failed with exit code {result.returncode}")
            sys.exit(1)

    except FileNotFoundError:
        print("❌ Claude Code CLI not found.")
        print("   Install with: npm install -g @anthropic-ai/claude-code")
        print("")
        print("   Alternatively, paste the following prompt into Claude Code manually:")
        print("=" * 60)
        print(prompt)
        print("=" * 60)
        sys.exit(1)


def run_claude_sdk(prompt: str, dry_run: bool = False) -> None:
    """Run doc-sync using the Claude Code Python SDK (alternative method)."""

    if dry_run:
        print("DRY RUN — see prompt above")
        return

    # Method 2: Using Claude Code Python SDK
    # Requires: pip install claude-code-sdk
    try:
        from claude_code_sdk import ClaudeCode  # type: ignore

        client = ClaudeCode()
        print("🔄 Starting doc-sync agent via Claude SDK...")

        response = client.run(
            prompt=prompt,
            cwd=str(PROJECT_ROOT),
            permissions=["Read(*)", "Write(docs/**)", "Bash(git *)"],
        )

        print("✅ Doc sync complete via SDK.")
        cleanup_changelogs()

    except ImportError:
        print("Claude Code SDK not installed. Falling back to CLI method.")
        run_claude_code(prompt, dry_run)


def cleanup_changelogs() -> None:
    """Move processed changelogs to archive."""
    if not CHANGELOG_DIR.exists():
        return

    archive_dir = CHANGELOG_DIR / "processed"
    archive_dir.mkdir(exist_ok=True)

    for f in CHANGELOG_DIR.glob("session_*.txt"):
        f.rename(archive_dir / f.name)
        print(f"   Archived: {f.name}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync project documentation with codebase")
    parser.add_argument("--phase", type=int, help="Phase number that just completed")
    parser.add_argument("--docs-only", choices=["api", "schema", "status"], help="Only sync specific doc")
    parser.add_argument("--dry-run", action="store_true", help="Preview prompt without running")
    parser.add_argument("--use-sdk", action="store_true", help="Use Claude Code Python SDK instead of CLI")
    args = parser.parse_args()

    print(f"📚 LinguaLeap Doc Sync")
    print(f"   Project: {PROJECT_ROOT}")
    print(f"   Time:    {datetime.now(timezone.utc).isoformat()}")
    print("")

    prompt = build_sync_prompt(args.phase, args.docs_only)

    if args.use_sdk:
        run_claude_sdk(prompt, args.dry_run)
    else:
        run_claude_code(prompt, args.dry_run)


if __name__ == "__main__":
    main()
