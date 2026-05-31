# 🧹 Project Cleanup Plan

**Feature**: Project Structure Restructure
**Manager**: Feature Manager
**Status**: ✅ Complete

## Execution Log

| Step | Action | Status |
|------|--------|--------|
| 1 | Delete obsolete `server/` directory | ✅ Done |
| 2 | Delete `docker-compose.yml`, `run.sh` | ✅ Done |
| 3 | Rename `client/` → `frontend/` | ✅ Done |
| 4 | Move `types/` → `frontend/types/` | ✅ Done |
| 5 | Move root `.md` docs → `cabinet/` | ✅ Done |
| 6 | Move `skills/` → `cabinet/` | ✅ Done |
| 7 | Update root `package.json` workspaces | ✅ Done |
| 8 | Update `.gitignore` (`client/dist/` → `frontend/dist/`) | ✅ Done |
| 9 | Create `README.md` | ✅ Done |
| 10 | Regenerate `node_modules` + `package-lock.json` | ✅ Done |

## Verification

| Check | Result |
|-------|--------|
| Go build (`go build ./...`) | ✅ Pass |
| TypeScript typecheck (`npx tsc --noEmit`) | ✅ Pass |
| npm install (fresh) | ✅ 182 packages, 0 vulnerabilities |
| Code review | ✅ No broken paths or references |

## Files Moved/Deleted

### Deleted
- `server/` — Entire Node.js Express server (replaced by Go backend)
- `docker-compose.yml` — Not needed (DB runs locally)
- `run.sh` — References old server setup

### Moved into `cabinet/`
- `ceo-review-output.md`
- `detailed-prd.md`
- `temp-prd.md`
- `eng-manager-review.md`
- `master-task-list.md`
- `implementation-architecture.md`
- `skills/` — All Codebuff skills

### Renamed
- `client/` → `frontend/` — Better naming convention
- `types/` → `frontend/types/` — Moved under frontend as a sub-workspace

### Created
- `README.md` — Project documentation
- `cabinet/cpo/feature-manager/feature-project-cleanup/brief.md` — This feature brief
