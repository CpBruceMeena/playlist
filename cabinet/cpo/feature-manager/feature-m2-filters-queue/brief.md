# 🎵 Feature Brief: M2 — Filters & Queue

**Feature**: YouTube Smart Playlist Creator — Full Filter Panel + Queue with Drag-Drop
**Phase**: M2
**Status**: 🟢 In Progress
**Target Completion**: End of Week 4

---

## Problem Statement

M1 delivered core generation (search + duration filter + player), but users need:
1. **More filters**: Upload date, full drag-and-drop queue reorder, shuffle, repeat, progress bar
2. **Better queue UX**: Reorderable queue with visual drag handles, now-playing indicator
3. **Playback refinements**: Dedicated progress bar, queue controls (shuffle/repeat) in queue section

## Scope

### In Scope

**Backend (Go):**
1. UploadDate filter in filter pipeline (last_week, last_month, last_year, custom range)
2. Wire UploadDate through the generate handler

**Frontend (React + TypeScript):**
1. `UploadDateSelect` component with preset options + custom date picker
2. `QueueList` component (extracted from PlaylistPage) with drag-and-drop reorder
3. `QueueItem` component with drag handle, thumbnail, info, duration
4. `DragHandle` component (visual grab handle ≡)
5. `ProgressBar` component (extracted from YouTubePlayer)
6. Queue controls section with video count, shuffle/repeat toggles
7. Update `filterStore` with upload date state
8. Update `FilterPanel` with UploadDateSelect integration
9. Update `PlaylistPage` with new QueueList component

### Out of Scope (M2)
- Save/share playlists (M3)
- Google OAuth (M3)
- Guest mode persistence (M3)
- Caching (M4)
- Accessibility audit (M4)
- Responsive layout refinements (M4)
- Production deployment (M4)

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| M1 Core Generation | ✅ Complete | All features working |
| YouTube API | ✅ Working | Search + video details |
| PostgreSQL | ✅ Running | localhost:5432 |

## Success Criteria

1. Upload date filter works (last week/month/year/custom range)
2. Queue items are draggable for reorder
3. Shuffle/Repeat toggles in both player controls and queue header
4. Progress bar shows current playback position
5. Queue shows video count and now-playing indicator
6. All TypeScript typechecks pass
7. Go backend builds clean
