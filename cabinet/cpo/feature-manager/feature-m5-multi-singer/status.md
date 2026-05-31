# Status: Multi-Singer Playlist (M5)

## Overall Status: 🟢 Complete

| Phase | Status | Gate |
|-------|--------|------|
| 🎨 Design | ✅ Complete | ✅ Gate 1 Passed |
| 🏗️ Backend Foundation | ✅ Complete | ✅ Gate 2 Passed |
| ⚡ Frontend Implementation | ✅ Complete | ✅ Gate 3 Passed |
| ✅ QA & Security | ✅ Complete | ✅ Gate 4 Passed |
| 🚀 Deployment | ✅ Complete | Pushed to origin/main |

## QA Results

### Backend API — ✅ PASS
| Test | Result |
|------|--------|
| Health check (`GET /api/health`) | ✅ `{"status":"ok"}` |
| List singers (`GET /api/v1/singers`) | ✅ ~103 singers across 5 genres |
| Genre filter (`?genre=punjabi`) | ✅ Only Punjabi singers returned |
| Case-insensitive search (`?search=TAYLOR`) | ✅ Finds Taylor Swift |
| Invalid genre (`?genre=xyz`) | ✅ Returns empty list |
| Validation: empty body (`POST /generate`) | ✅ `VALIDATION_ERROR` |
| Validation: empty singer_ids | ✅ `VALIDATION_ERROR` |
| Validation: >5 singers | ✅ `VALIDATION_ERROR` |
| Invalid UUID | ✅ Graceful warning, no crash |
| Edge cases (limit=0, limit=200) | ✅ Handled correctly |
| Context cancellation (goroutine leak fix) | ✅ Added ctx.Done() checks + sendOrCancel |

### Frontend UI — ✅ PASS (Core)
| Test | Result |
|------|--------|
| Homepage load | ✅ Renders correctly |
| Search / Singers tabs | ✅ Visible and clickable |
| Singer grid render | ✅ Cards with avatars, names, genres |
| Genre filter chips | ✅ All/Punjabi/Haryanvi/Hindi/Old Hindi/English |
| Singer search | ✅ Client-side filtering works |
| Multi-select (max 5) | ✅ Selection count badge, disabled on max |
| Generate combined playlist | ✅ Annotates videos with singer names |
| Queue item badges | ✅ Singer name shown on each video |
| "Combined from X singers" banner | ✅ Shows on playlist page |
| Tab state preservation | ✅ Selection persists on tab switch |

### Bug Hunter — ✅ PASS (No vulnerabilities)
| Test | Result |
|------|--------|
| Input fuzzing (long strings, special chars, XSS) | ✅ No injection, no crash |
| State transitions (rapid tab switching) | ✅ State preserved |
| Race conditions (rapid filter/search) | ✅ No glitches |
| Back/forward navigation | ✅ Works correctly |
| Console errors | ✅ None found |

## Issues Found & Fixed
- [x] Backend needed restart to pick up new routes (singer endpoints returning 404)
- [x] Goroutine leak in GenerateMultiSinger — fixed with request context cancellation
- [x] Rate limiter (10 req/min) can be hit during rapid testing — design choice, not a bug
- [x] No security vulnerabilities found

## Enhancement Batch (May 31, 2026)

### 🖥️ Frontend Polish
- **SelectedSingerChips** — Selected singers now appear as removable chips in the Search tab with genre-colored badges and cross button for deselection
- **FilterPanel redesign** — Desktop-optimized 2-column grid layout, section dividers with icon labels, improved visual hierarchy, sticky reset button

### 🗄️ YouTube Cache (Rate-Limit Fallback)
- **YouTubeCache model** — DB table (cache_key, cache_type, response_json, quota_used, hit_count, expires_at) for testing purposes
- **CacheService** — Cache-first with rate-limit fallback (serves expired cache on 403/429); TTL of 1 hour; startup purge
- Integrated into both `Generate` and `GenerateMultiSinger` handlers

### 💾 Playlist Persistence
- **Playlist CRUD endpoints** — POST/GET/GET:id/DELETE `/api/v1/playlists`
- **Dedup by query_hash** — SHA-256 hash of query + video IDs prevents duplicate saves
- **Frontend save integration** — PlaylistPage saves to backend first, falls back to localStorage if backend unavailable; no double-save

### 🛠️ Infrastructure Changes
- **AutoMigrate removed** — `EnsureTables()` uses `HasTable()` + `CreateTable()`; conditional seed checks row count
- **Migrate service** — TableDefinition pattern with optional seed functions
- **Playlist model** — New GORM model with query_hash (unique index), filters JSON, videos via has-many

### 🐛 Issues Fixed
- Custom `contains`/`containsStr` → `strings.Contains` in cache.go
- N+1 query: per-playlist COUNT → single LEFT JOIN + GROUP BY
- Double-save: only saves to localStorage when backend unavailable
- CacheKey type mismatch: int args now wrapped in `fmt.Sprintf`
- localStorage error: fallback path checks `savePlaylist` return for errors

## Final Commit
`e23cbaf` — M5: Multi-Singer feature — backend seed data, API, and frontend UI

## What's Delivered
- Backend: Singer GORM model, 100+ curated singers across 5 genres
- Backend: GET /api/v1/singers with genre filter, search, and limit
- Backend: POST /api/v1/generate/multi-singer — parallel YouTube searches with context cancellation
- Backend: YouTubeCache model + CacheService for rate-limit fallback
- Backend: Playlist CRUD endpoints with query_hash dedup
- Backend: EnsureTables replaces AutoMigrate; conditional seed on row count
- Frontend: SingerSelector — search, genre chips, singer grid, max 5 selection
- Frontend: SelectedSingerChips — removable singer chips in Search tab
- Frontend: FilterPanel redesign — desktop-optimized 2-column grid
- Frontend: Singer attribution badges on queue items and playlist header
- Frontend: Playlist save to backend with localStorage fallback
