# 🎵 Feature Brief: M1 — Core Generation

**Feature**: YouTube Smart Playlist Creator — Core Generation Flow
**Phase**: M1
**Status**: 📋 Planning
**Target Completion**: End of Week 2

---

## Problem Statement

Users can describe a playlist in natural language (e.g., "Arijit Singh love songs"), but there's currently no working product — only page skeletons. M1 bridges this gap by delivering a functioning end-to-end flow: type a query → get a playlist → play it.

## Scope

### In Scope

**Backend (Go + Gin + GORM):**
1. Go project structure (main.go, routes.go, structs/, handlers/, services/, clients/)
2. GORM models matching the Prisma schema (User, Playlist, PlaylistVideo)
3. YouTube Data API v3 client (search + video details)
4. Duration filter service (parse ISO 8601 → filter by min/max seconds)
5. Keyword include/exclude filter service (case-insensitive match on title/tags/description)
6. Video type classification (music/live/shorts/standard heuristics)
7. `POST /api/v1/generate` endpoint with:
   - Rate limiting (10 req/min per IP)
   - Input validation (Zod-equivalent in Go)
   - Filter pipeline → return videos
8. CORS middleware for dev (localhost:5173)

**Frontend (React + TypeScript + Tailwind + Zustand):**
1. UI primitive components (Button, Input, Select, Slider, Toggle, Chip, Spinner, Skeleton)
2. Layout components (Header, PageShell)
3. Feedback components (LoadingSkeleton, ErrorState, EmptyState)
4. Zustand stores (filterStore, playlistStore, playerStore)
5. SearchInput + Generate button
6. FilterPanel (collapsible) with DurationSlider
7. YouTube IFrame Player integration (useYouTubePlayer hook + component)
8. Basic player controls (play/pause/skip)
9. Auto-advance logic (onStateChange=ENDED → next video)
10. PlaylistPage with player + queue layout
11. API integration: generate API function
12. Connect HomePage → Generate → PlaylistPage flow

**Database:**
- PostgreSQL connection via GORM
- Auto-migrate GORM models

### Out of Scope (M1)

- Save/share playlists (M3)
- Google OAuth (M3)
- All other filters (M2): VideoType, UploadDate, MinViews, SafeSearch
- Queue operations (M2): drag-drop, shuffle, repeat
- Progress bar, volume control (M2)
- Caching (M4)
- Accessibility (M4)
- Responsive/mobile layout (M4)
- CI/CD pipeline
- Production deployment

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| YouTube API key | ✅ Provided | Key in backend/.env |
| Go installed | ❌ Need to verify | `go version` |
| PostgreSQL | ✅ Running | localhost:5432, user=postgres, password=password |
| Frontend skeleton | ✅ Built | Pages exist, need components + stores + logic |

## Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend language | Go | Per user direction |
| HTTP framework | Gin | Most popular Go framework |
| DB ORM | GORM | Full ORM with auto-migration |
| Go project location | `backend/` | New directory |
| Go structure | Layered: routes/handlers/services/clients/structs | Per user direction |
| Frontend state | Zustand | Already in dependencies |
| UI framework | Tailwind CSS v4 | Already configured |

## Success Criteria

1. User types a query → clicks Generate → videos appear within 3 seconds
2. Duration filter works (min/max seconds)
3. Keyword include/exclude filters work
4. Click any video → YouTube IFrame Player loads and plays
5. Video ends → next video auto-advances
6. Error states display gracefully (no results, API error, rate limited)
7. Loading skeletons show during generation
