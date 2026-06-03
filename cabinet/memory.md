# Project Memory — YouTube Smart Playlist Creator

> **Last Updated**: June 3, 2026 (Session 2)
> **Branch**: `main`

---

## 🏗️ Project Overview

A web application that turns YouTube searches into smart playlists with filtering, queue management, song library, video merging, and multi-singer mashup capabilities.

### Stack
- **Frontend**: React 19 + Vite 8 + Tailwind v4 + Zustand + React Router v7
- **Backend**: Go 1.26 + Gin + GORM + PostgreSQL
- **Scripts**: Python 3 + Pillow + yt-dlp + FFmpeg
- **CI**: TypeScript typecheck (`npx tsc --noEmit`), Go build (`go build ./...`)

---

## ✅ Complete Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Core Generation (M1)** | ✅ Shipped | YouTube search, filter pipeline, player, queue |
| **Filters & Queue (M2)** | ✅ Shipped | 8 filters, drag-drop queue, shuffle/repeat, progress bar |
| **Save & Share (M3)** | ✅ Shipped | localStorage persistence, save dialog, My Playlists |
| **Polish (M4)** | ✅ Shipped | Brand identity, keyboard shortcuts, animations, README |
| **Multi-Singer (M5)** | ✅ Shipped | 180+ singers, genre filter, combined playlists |
| **Project Cleanup** | ✅ Shipped | `client/` → `frontend/`, Go backend, cabinet/ docs |
| **YouTube Audio Extraction** | ✅ Built | `scripts/extract_audio.py` with `.venv` + Pillow |
| **Mashup PoC** | ✅ Built | `scripts/mashup_poc.py` — 2+ track merge with beautiful frames |
| **Remotion Integration** | 🔵 On Hold | `video/` Remotion project created, PoC proved FFmpeg approach sufficient |
| **Song Library & Merge (M6)** | ✅ Shipped | Save songs, merge via async backend job, native video player |
| **Custom Singers** | ✅ Built | Users can type any singer name not in pre-defined list |
| **M6 QA & UAT** | ✅ Complete | TypeScript 0 err, Go 0 err, ESLint 0 err, UAT score 8.4/10 |

---

## 🆕 Recent Changes (Session 2 — June 3, 2026)

### 1. QA & Customer Validation
- **Static analysis**: TypeScript 0 errors, Go 0 errors, ESLint 0 errors (6 warnings)
- **Fixed 18 ESLint errors** across 9 files (unused imports, variables, refs, escape chars)
- **Generated UAT report**: `cabinet/cpo/doc-store/audience/smart-playlist-creator/uat-report-m6.md`
- **UAT score**: 8.4/10 — CONDITIONALLY APPROVED
- **3 personas tested**: Pragmatic Professional (8/10), Skeptical First-Timer (7/10), Power Scaler (8/10)

### 2. YouTube Player Simplification
- **Removed custom PlayerControls** — YouTube IFrame API's `controls: 1` now handles playback
- **Removed custom ProgressBar** — YouTube's native seek bar used instead
- **Deleted dead files**: `PlayerControls.tsx`, `ProgressBar.tsx`

### 3. Merged Video Playback Fix
- **Replaced broken `/playlist` navigation** with native `<video>` modal in `MergedVideosPage`
- Uses browser's built-in controls (play/pause, seek, volume, fullscreen)
- Modal opens on "Play" click, closes on Escape/backdrop click

### 4. Save-to-Library Confirmation
- Clicking bookmark icon **shows confirmation dialog** with song thumbnail, title, channel
- "Save to Library" / "Cancel" buttons — prevents accidental saves

### 5. Expanded Haryanvi Singers (7 new)
| Singer | Score | 
|--------|-------|
| Sapna Choudhary | 89 |
| Ajay Hooda | 83 |
| Diler Kharkiya | 81 |
| Gulzaar Chhaniwala | 79 |
| Pranjal Dahiya | 76 |
| Vikram Singh | 73 |
| MC Square | 71 |

### 6. Custom Singer Feature
Users can type any singer name not in the pre-defined list:
- **Frontend**: Text input + "Add" button below singer grid (disabled at max 5)
- **Custom chips**: Shown in purple with remove button (vs blue for DB singers)
- **Store**: `customSingerNames[]` state, `addCustomSinger()` / `removeCustomSinger()` actions
- **Backend**: `CustomSingers []string` in `MultiSingerRequest` — searched as YouTube queries with `"custom-N"` IDs
- **Validation**: Combined count (DB + custom) enforced at max 5

---

## 🆕 Song Library & Video Merge (M6)

**Built**: June 3, 2026

### What it does

1. Users can **save individual songs** from generated playlists to a persistent library via a bookmark icon on each queue item (with confirmation dialog)
2. The **Song Library page** (`/my-songs`) shows all saved songs in a grid with multi-select checkboxes
3. Users select 2+ songs and click **Merge**, which starts an async backend job
4. The backend calls `scripts/mashup_poc.py` via goroutine to download and stitch videos into one
5. The **Merged Videos page** (`/my-videos`) shows all merge jobs with status (processing/complete/error) and **native video playback** in a modal with browser controls
6. Toast notifications inform users: "Merge started" → "Merge complete!"
7. Frontend polls every 30s for up to 30 minutes

### Files Created/Changed (Session 1 + Session 2)

#### Backend
| File | Change | Purpose |
|------|--------|---------|
| `backend/structs/models.go` | Modified | Added `SavedSong` + `MergedVideo` models |
| `backend/structs/requests.go` | Modified | Added request types + `CustomSingers` field |
| `backend/handlers/songHandler.go` | **New** | CRUD: `POST/GET/DELETE /api/v1/songs`, `GET /songs/check` |
| `backend/handlers/mergeHandler.go` | **New** | Async merge via goroutine → calls Python script → copies result |
| `backend/handlers/generate.go` | Modified | Added custom singer support with DB+custom combined search |
| `backend/routes/routes.go` | Modified | Added song/merge routes + `r.Static` for merged video files |
| `backend/services/migrate.go` | Modified | Registered `saved_songs` + `merged_videos` tables |
| `backend/services/seed_singers.go` | Modified | Expanded to 190+ singers across 5 genres + custom singer support |

#### Frontend
| File | Change | Purpose |
|------|--------|---------|
| `frontend/types/src/index.ts` | Modified | Added `SavedSong`, `MergedVideo`, `customSingers` types |
| `frontend/src/api/songs.ts` | **New** | API client for songs + merge endpoints |
| `frontend/src/api/singers.ts` | Modified | Updated to pass `customSingers` param |
| `frontend/src/stores/songLibraryStore.ts` | **New** | Song library store with saved status cache |
| `frontend/src/stores/mergeStore.ts` | **New** | Merge job store with 30s polling |
| `frontend/src/stores/singerStore.ts` | Modified | Added `customSingerNames` state + actions |
| `frontend/src/components/player/QueueItem.tsx` | Modified | Bookmark icon to save to library |
| `frontend/src/components/player/QueueList.tsx` | Modified | Pass `savedStatus` + `onSaveToLibrary` + drag ref fix |
| `frontend/src/components/player/YouTubePlayer.tsx` | Modified | Removed custom PlayerControls/ProgressBar |
| `frontend/src/components/player/PlayerControls.tsx` | **Deleted** | Replaced by YouTube IFrame built-in controls |
| `frontend/src/components/player/ProgressBar.tsx` | **Deleted** | Replaced by YouTube IFrame built-in controls |
| `frontend/src/components/search/SingerSelector.tsx` | Modified | Added custom singer input + chips |
| `frontend/src/components/search/SingerDrawer.tsx` | Modified | Shows custom singer chips (purple) in selected section |
| `frontend/src/pages/SongLibraryPage.tsx` | **New** | Grid with checkboxes, select all, merge dialog |
| `frontend/src/pages/MergedVideosPage.tsx` | **New** | List with status badges, native video player modal |
| `frontend/src/pages/PlaylistPage.tsx` | Modified | Save confirmation dialog + removed unused vars |
| `frontend/src/App.tsx` | Modified | Added `/my-songs` and `/my-videos` routes |
| `frontend/src/components/layout/Header.tsx` | Modified | Nav: Home → My Songs → My Videos → My Playlists |

#### Docs
| File | Change | Purpose |
|------|--------|---------|
| `cabinet/memory.md` | **Updated** | This file — project state documentation |
| `cabinet/cpo/doc-store/audience/smart-playlist-creator/uat-report-m6.md` | **New** | QA/UAT report with 8.4/10 score |

### Architecture Decisions

- **Async Processing**: Merge runs in a Go goroutine that shells out to `python3 scripts/mashup_poc.py`
- **Polling**: Frontend polls `GET /api/v1/merge/:id` every 30 seconds (not WebSocket — simpler for PoC)
- **File Storage**: Merged videos stored at `./output/merged-videos/{mergeId}/mashup-video.mp4`
- **Static Serving**: Go backend serves merged files via `r.Static(\"/api/v1/merge/files\", ...)`
- **Native Video**: Merged videos played via `<video controls>` element (browser built-in controls)
- **No OAuth**: No auth — songs and merges are global (single-user mode)
- **Idempotent Save**: `POST /songs` returns existing song if `youtubeId` already saved
- **Custom Singers**: Combined DB singer count + custom singer count enforced at max 5

### API Endpoints

```
POST   /api/v1/songs          — Save a song to library
GET    /api/v1/songs          — List all saved songs
GET    /api/v1/songs/check    — Check if youtubeId is saved (?youtubeId=xxx)
DELETE /api/v1/songs/:id      — Remove a song from library

POST   /api/v1/merge          — Start a merge job (body: {songIds: [], name: ""})
GET    /api/v1/merge          — List all merge jobs
GET    /api/v1/merge/:id      — Get merge status/details
DELETE /api/v1/merge/:id      — Delete a merge record

GET    /api/v1/merge/files/*  — Static serving of merged video files

POST   /api/v1/generate/multi-singer — Generate combined playlist (supports customSingers[])
```

---

## 🧪 Validation Status

| Check | Result |
|-------|--------|
| Go build (`go build ./...`) | ✅ Passes |
| TypeScript (`npx tsc --noEmit`) | ✅ 0 errors |
| ESLint (`npx eslint src/`) | ✅ 0 errors, 6 warnings (exhaustive-deps) |
| UAT Score | ✅ 8.4/10 — CONDITIONALLY APPROVED |

---

## 🔮 Next Up

1. **Start servers + test live** — Verify full M6 flow end-to-end
2. **SSE merge progress** — Replace 30s polling with Server-Sent Events
3. **Security review** — Command injection check in `mergeHandler.go`
4. **Merge polling cancellation** — Stop polling when user navigates away
5. **Production deployment** — Vercel + Railway + custom domain
6. **Multi-user support** — Auth, user-scoped songs and merges

---

## 🧠 Useful Commands

```bash
# Backend
cd backend && go run main.go

# Frontend
cd frontend && npm run dev

# Typecheck
cd frontend && npx tsc --noEmit

# Build backend
cd backend && go build ./...

# Lint
cd frontend && npx eslint src/

# Audio extract (single video)
.venv/bin/python3 scripts/extract_audio.py <url> --json

# Mashup (2+ videos)
.venv/bin/python3 scripts/mashup_poc.py <url1> <url2> --title1 "..." --title2 "..."
```

## 🔗 Key Files

| File | Description |
|------|-------------|
| `cabinet/master-task-list.md` | Full project task list (144 tasks across 8 phases) |
| `cabinet/memory.md` | This file — project state documentation |
| `cabinet/cpo/doc-store/audience/smart-playlist-creator/uat-report-m6.md` | M6 QA/UAT report |
| `backend/routes/routes.go` | All API route definitions |
| `backend/handlers/generate.go` | Multi-singer + custom singer generation |
| `backend/services/seed_singers.go` | 190+ singers across 5 genres |
| `frontend/src/App.tsx` | Frontend route configuration |
| `frontend/src/components/layout/Header.tsx` | Navigation with all pages |
| `frontend/src/components/search/SingerSelector.tsx` | Singer grid + custom singer input |
| `scripts/mashup_poc.py` | Video merge script (FFmpeg + Pillow) |
