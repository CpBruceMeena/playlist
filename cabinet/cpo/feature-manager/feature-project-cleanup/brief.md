# 🧹 Project Structure Cleanup

**Feature**: Project Restructure
**Manager**: Feature Manager
**Target Date**: May 30, 2026
**Status**: In Progress

## Goal
Restructure the project root to contain only `backend/`, `frontend/`, `cabinet/`, and `README.md`. All other files and directories should be cleaned up (moved into appropriate folders or deleted).

## Current Root Layout (Before)
```
root/
├── backend/          ← KEEP (Go backend)
├── client/           → RENAME to frontend/
├── cabinet/          ← KEEP
├── types/            → MOVE into frontend/
├── server/           → DELETE (replaced by Go backend)
├── skills/           → MOVE into cabinet/
├── .github/          ← KEEP (GitHub-specific)
├── *.md docs         → MOVE into cabinet/
├── docker-compose.yml → DELETE (DB runs locally)
├── run.sh            → DELETE (references old server)
├── package.json      → UPDATE workspaces
└── .gitignore        ← KEEP
```

## Target Root Layout (After)
```
root/
├── backend/          # Go backend (Gin + GORM + PostgreSQL)
├── frontend/         # React frontend (Vite + Tailwind + Zustand)
│   └── types/        # Shared TypeScript types (moved from root)
├── cabinet/          # All docs, plans, reviews, skills
│   ├── cpo/          # Feature management
│   ├── skills/       # Codebuff skills (moved from root)
│   ├── ceo-review-output.md
│   ├── detailed-prd.md
│   ├── temp-prd.md
│   ├── eng-manager-review.md
│   ├── master-task-list.md
│   └── implementation-architecture.md
├── .github/          # GitHub CI/CD templates
├── README.md         # Project documentation (new)
├── .gitignore        # Git ignore rules
├── package.json      # Root workspace config (updated)
└── .env              # Shared environment vars
```

## What's In Scope
- Rename `client/` → `frontend/`
- Move `types/` inside `frontend/`
- Delete `server/` (obsolete Node.js server)
- Delete `docker-compose.yml`, `run.sh`
- Move all root `.md` docs into `cabinet/`
- Move `skills/` into `cabinet/`
- Update root `package.json` workspaces
- Create `README.md`
- Update all cross-references (imports, configs, gitignore)

## What's Out of Scope
- Renaming the `cabinet/` directory structure
- Renaming Go package names
- Renaming any exported symbols
- Code logic changes

## Risks
- npm workspace references need careful updating
- git history for moved/renamed files
- Breaking imports between packages
