# Superpowers — Development Methodology

This project uses **Superpowers**, an agentic skills framework & software development methodology.

## How to Use Superpowers

Before every response or action — including clarifying questions — check if any superpowers skill applies. If there's even a 1% chance a skill applies, invoke it.

### Priority Order
1. User explicit instructions (highest)
2. Superpowers skills (see below)
3. Default system prompt (lowest)

## Available Skills

Skills are located in `.superpowers/skills/`. Read and follow them as needed.

### Core Workflow (used in order)

| Phase | Skill | When to Use |
|-------|-------|-------------|
| 1 | **brainstorming** | Before ANY implementation. Explore context, clarify requirements, propose approaches, present design for approval |
| 2 | **writing-plans** | After design approval. Break work into bite-sized tasks (2-5 min each) with exact file paths, code, and verification |
| 3 **or** | **subagent-driven-development** | Executing plans via subagents — dispatch per-task with two-stage review (spec then quality) |
| 3 **or** | **executing-plans** | Executing plans inline with review checkpoints |
| 4 | **requesting-code-review** | After each task, major feature, before merge |
| 5 | **receiving-code-review** | When responding to feedback |
| 6 | **finishing-a-development-branch** | When all tasks complete — verify tests, present merge/PR/keep/discard options |

### Supporting Skills

| Skill | When to Use |
|-------|-------------|
| **test-driven-development** | ALL implementation — RED-GREEN-REFACTOR cycle. No production code without a failing test first |
| **systematic-debugging** | When debugging — 4-phase root cause process before any fix |
| **using-git-worktrees** | Before starting work on a new feature branch |
| **dispatching-parallel-agents** | When investigating 2+ independent issues |
| **verification-before-completion** | Before claiming any task as complete — fresh evidence required |

## The Golden Rules

1. **Brainstorm before building** — Never implement before design approval
2. **TDD always** — No production code without a failing test first
3. **Verify before claiming** — Fresh command output, no "should" or "probably"
4. **Evidence over claims** — Every completion claim backed by proof
5. **YAGNI** — Build what's needed, nothing more
