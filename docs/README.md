# Documentation System — How It Works

## The Problem

When agent teams work across multiple phases, documentation becomes stale.
Phase 2 agents read Phase 0 docs that don't reflect what Phase 1 actually built.
Simply appending to one big file creates noise. Overwriting loses context.

## The Solution: Layered Docs + Doc-Sync Agent

### Layer 1: CLAUDE.md (Index)
- Small, structural, rarely changes
- Points agents to the right doc files
- Contains project rules that apply to ALL agents
- **Never modified by agents** (protected in settings.json)

### Layer 2: /docs/ (Living Documentation)
- Separate files for separate concerns
- Each file is the source of truth for its domain
- Updated by the **doc-sync agent** — not by feature agents

### Layer 3: Hooks (Automation)
- **PreSession.sh**: Warns if docs are stale before agent starts
- **PostSession.sh**: Collects CHANGELOG_ENTRYs from git commits
- **TaskCompleted.sh**: Validates tests exist, types are hinted

### Layer 4: Doc-Sync Agent (The Rewriter)
- Single-purpose agent that reads code and rewrites docs
- Runs between phases (not during)
- REWRITES files completely — never appends
- Ensures docs describe what EXISTS, not what was PLANNED

## Workflow

```
Phase N Agent Team Works
     │
     ├── Agents write code + tests
     ├── Agents add CHANGELOG_ENTRY to commits
     ├── TaskCompleted hook validates quality
     │
     ▼
Phase N Complete
     │
     ├── PostSession hook collects changelogs
     │
     ▼
Run Doc-Sync Agent  ◄── python .claude/scripts/doc_sync.py --phase N
     │
     ├── Reads ALL source code
     ├── Reads changelog entries
     ├── REWRITES docs/ files
     ├── Commits + tags (doc-sync-YYYYMMDD)
     │
     ▼
Phase N+1 Agent Team Starts
     │
     ├── PreSession hook confirms docs are fresh
     ├── Agents read accurate documentation
     └── Work begins with correct context
```

## File Inventory

```
CLAUDE.md                              ← Project index (DO NOT EDIT)
docs/
  architecture.md                      ← System design, data flow, service boundaries
  conventions.md                       ← Code style, naming, patterns (rarely changes)
  api-contracts.md                     ← Every API endpoint with request/response shapes
  database-schema.md                   ← Every table with columns and types
  phase-status.md                      ← What's built, what's not, changelog
  agent-teams.md                       ← Team configs and spawn prompts per phase
  decisions.md                         ← Architecture Decision Records (ADRs)
.claude/
  settings.json                        ← Agent teams enabled, permissions, hooks config
  hooks/
    PreSession.sh                      ← Checks doc freshness before session
    PostSession.sh                     ← Collects changelogs after session
    TaskCompleted.sh                   ← Validates quality on task completion
  scripts/
    doc_sync.py                        ← Programmatic doc-sync via Claude Code SDK/CLI
  changelogs/                          ← Temporary changelog storage (auto-cleaned)
```

## Quick Reference

```bash
# After Phase 1 completes — sync docs
python .claude/scripts/doc_sync.py --phase 1

# Just sync API docs after adding endpoints
python .claude/scripts/doc_sync.py --docs-only api

# Preview what would be synced (no changes)
python .claude/scripts/doc_sync.py --dry-run

# Manual doc-sync via Claude Code
# (paste this prompt into Claude Code directly)
# See docs/agent-teams.md → "Between Phases: Doc-Sync" for the full prompt
```
