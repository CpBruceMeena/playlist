# Project State

## ⚡ Superpowers — Development Methodology
This project uses Superpowers (obra/superpowers) — an agentic skills framework. See `.superpowers/SUPERPOWERS.md` for the full methodology.

**Before any response or action**, check if a superpowers skill applies:
1. Read `.superpowers/skills/using-superpowers/SKILL.md` first (startup bootstrap)
2. If brainstorming, planning, or implementation — read the relevant skill before proceeding
3. Follow the core workflow: Brainstorm → Plan → Execute (TDD) → Review → Finish

**Iron Rules:**
- No implementation without design approval (brainstorming skill)
- No production code without a failing test first (TDD skill)
- No completion claims without fresh verification evidence

## Git Status
6ab353a feat: My Songs page, merge ordering dialog, saved songs/merged videos stores, backend merge route, Python merge server, .gitignore cleanup
6eecb7e fix: merge order dialog starts empty, tap to build order; ignore ui_design/ exports
bc28439 Clean up POC Song Library and Merge feature (M6)
fde2915 Restore shorts/live as optional video types (not selected by default)
9a1db9b Fix YouTube playback, singer chips, back button, header redesign, and update README

?? memory.md

## Git Hooks
- Located in `.githooks/` (committed to repo, configured via `git config core.hooksPath .githooks`)
- **pre-commit**: Blocks commits on `main`/`master` — use `git commit --no-verify` to bypass
- **pre-push**: Blocks pushes to `main`/`master` — use `git push --no-verify` to bypass
- All new clones must run: `git config core.hooksPath .githooks`

## Running Services
- Frontend: 39301
40628
running (port 5173)
- Backend: 40601
40628
running (port 3001)
- Merge Server: 40596
40601
running (port 5002)

## Project Structure
- Frontend: Vite React app at /frontend
- Backend: Go server at /backend
- Merge Server: Python Flask at /scripts/merge_server.py

## Key Files
- Merge order dialog: frontend/src/components/processing/MergeOrderDialog.tsx
- My Songs page: frontend/src/pages/MySongsPage.tsx
- Merged Videos page: frontend/src/pages/MergedVideosPage.tsx
- Background merge runner: frontend/src/api/mergeRunner.ts
- Merge API: frontend/src/api/merge.ts
- Saved songs store: frontend/src/stores/savedSongsStore.ts
- Merged videos store: frontend/src/stores/mergedVideosStore.ts
- Queue (selection mode): frontend/src/components/player/QueueList.tsx

## Branch
feat/db-persistence

## Data Persistence
- Saved songs (My Songs) and saved playlists are persisted in PostgreSQL via the Go backend
- Frontend stores (`savedSongsStore`, `savedPlaylistsStore`) call the backend API — no longer localStorage-only
- One-time migration on first load: legacy localStorage data is pushed to the backend
- Backend: `saved_songs` table (songs.go handler), `playlists` + `playlist_videos` tables (playlists.go handler)

## Removed
- Android app (`/mobile`) removed from the repo — out of scope, backend + frontend only
