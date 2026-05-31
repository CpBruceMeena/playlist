# 📋 Feature Plan: M1 — Core Generation

**Duration**: ~5 days  
**Team**: Engineering Frontend + Engineering Backend + Engineering Database  
**Dependencies**: Go runtime, PostgreSQL, YouTube API key (✅ provided)  

---

## Dependency Graph

```
Day 1: Set Up                        Day 2: Foundation               Day 3: Core Logic            
┌──────────────────┐                ┌──────────────────────┐        ┌─────────────────────────┐
│ Go project init   │                │ GORM models + migrate│        │ YouTube API client       │
│ go.mod + modules  │◄──────────────►│ Database connection  │───────►│ search + video details   │
│ main.go + Gin     │                │ Auto-migrate on start│        │ API key mgmt             │
│ Config loading    │                └──────────────────────┘        └──────────┬──────────────┘
│ .env parsing      │                                                                │
└──────────────────┘                                                               │
        │                                                                          │
        ▼                                                                          ▼
┌──────────────────┐                ┌──────────────────────┐        ┌─────────────────────────┐
│ Frontend:         │                │ Frontend:             │        │ Backend:                 │
│ UI primitives     │◄──────────────►│ Zustand stores        │───────►│ Generate endpoint        │
│ Button, Input,    │                │ filterStore           │        │ Handler + validation     │
│ Select, Slider,   │                │ playlistStore         │        │ Rate limiting            │
│ Toggle, Chip, etc.│                │ playerStore           │        │ Filter service           │
│ Layout components │                └──────────┬───────────┘        └──────────┬──────────────┘
└──────────────────┘                           │                               │
                                                ▼                               ▼
Day 4: Integration                    Day 5: Polish & E2E               
┌─────────────────────────────┐       ┌──────────────────────────────┐
│ HomePage + Search + Filters  │       │ Error states                 │
│ → Generate API call          │       │ Loading skeletons            │
│ → Navigate to PlaylistPage   │       │ Edge case handling           │
│                              │       │ End-to-end testing           │
│ YouTubePlayer + Controls     │       │ Generate → Play → Auto-adv  │
│ Auto-advance logic           │       │                              │
└─────────────────────────────┘       └──────────────────────────────┘
```

---

## Task Breakdown

### Day 1: Project Setup & Foundation

#### Backend Setup (engineering-backend)
| # | Task | Files | Effort |
|---|------|-------|--------|
| 1 | Initialize Go module (`go mod init`) | `backend/go.mod` | 15 min |
| 2 | Add Gin, GORM, godotenv, pgx dependencies | `backend/go.mod`, `backend/go.sum` | 15 min |
| 3 | Create main.go with Gin setup + server start | `backend/main.go` | 30 min |
| 4 | Create config loader (env vars) | `backend/config/config.go` | 20 min |
| 5 | Create routes.go with route definitions | `backend/routes.go` | 20 min |
| 6 | Create CORS middleware | `backend/middleware/cors.go` | 15 min |
| 7 | Set up PostgreSQL connection + health check | `backend/main.go` | 30 min |

#### Frontend Setup (engineering-frontend)
| # | Task | Files | Effort |
|---|------|-------|--------|
| 1 | Create UI primitive components | `client/src/components/ui/` | 2 hours |
| 2 | Create layout components (Header) | `client/src/components/layout/` | 30 min |
| 3 | Create feedback components (Skeleton, Error, Empty) | `client/src/components/feedback/` | 1 hour |

### Day 2: Models, Database, Stores

#### Database (engineering-database)
| # | Task | Files | Effort |
|---|------|-------|--------|
| 1 | Create GORM models (User, Playlist, PlaylistVideo) | `backend/structs/` | 1 hour |
| 2 | Set up auto-migration in main.go | `backend/main.go` | 15 min |

#### Frontend (engineering-frontend)
| # | Task | Files | Effort |
|---|------|-------|--------|
| 1 | Create filterStore (all filter state + actions) | `client/src/stores/filterStore.ts` | 1 hour |
| 2 | Create playlistStore (generate + state) | `client/src/stores/playlistStore.ts` | 1 hour |
| 3 | Create playerStore (player state + actions) | `client/src/stores/playerStore.ts` | 1 hour |
| 4 | Create API generate function | `client/src/api/generate.ts` | 20 min |

### Day 3: Core Backend Logic

#### Backend (engineering-backend)
| # | Task | Files | Effort |
|---|------|-------|--------|
| 1 | Create YouTube API client (search + video details) | `backend/clients/youtube.go` | 2 hours |
| 2 | Create filter service (duration + keywords) | `backend/services/filter.go` | 1.5 hours |
| 3 | Create video type classification | `backend/services/filter.go` | 30 min |
| 4 | Create generate handler | `backend/handlers/generate.go` | 45 min |
| 5 | Create generate service (orchestrates YouTube + filter) | `backend/services/generate.go` | 30 min |
| 6 | Create rate limiter middleware | `backend/middleware/rate_limiter.go` | 30 min |
| 7 | Create request structs (GenerateRequest, FilterPayload, etc.) | `backend/structs/requests.go` | 30 min |

### Day 4: Frontend Integration

#### Frontend (engineering-frontend)
| # | Task | Files | Effort |
|---|------|-------|--------|
| 1 | Build SearchInput component | `client/src/components/search/SearchInput.tsx` | 30 min |
| 2 | Build FilterPanel with DurationSlider | `client/src/components/search/FilterPanel.tsx`, `client/src/components/search/DurationSlider.tsx` | 1.5 hours |
| 3 | Build complete HomePage (search → generate → navigate) | `client/src/pages/HomePage.tsx` | 1 hour |
| 4 | Implement useYouTubePlayer hook | `client/src/hooks/useYouTubePlayer.ts` | 1.5 hours |
| 5 | Build YouTubePlayer component | `client/src/components/player/YouTubePlayer.tsx` | 45 min |
| 6 | Build PlayerControls (play/pause/skip) | `client/src/components/player/PlayerControls.tsx` | 1 hour |
| 7 | Implement auto-advance logic | `client/src/stores/playerStore.ts` | 30 min |
| 8 | Build PlaylistPage (player + queue layout) | `client/src/pages/PlaylistPage.tsx` | 1.5 hours |

### Day 5: Polish & E2E

#### All
| # | Task | Files | Effort |
|---|------|-------|--------|
| 1 | Wire up LoadingSkeleton on HomePage | `client/src/pages/HomePage.tsx` | 30 min |
| 2 | Wire up ErrorState + EmptyState | `client/src/pages/HomePage.tsx` | 30 min |
| 3 | Handle edge cases (empty query, API error, rate limit) | Various | 1 hour |
| 4 | End-to-end manual test: Generate → Play → Auto-advance | — | 1 hour |
| 5 | Fix bugs found in E2E test | Various | 1 hour |

---

## Engineering Manager Gate Reviews

| Gate | Phase | Review Focus | Check |
|------|-------|-------------|-------|
| **Gate 2: Architecture** | Before Day 1 coding | Go project structure, route design, filter pipeline architecture | ⏳ |
| **Gate 3: Implementation** | End of Day 3 | Backend endpoints working, frontend stores + components complete | ⏳ |
| **Gate 5: Pre-Deployment** | End of Day 5 | E2E flow working, error states handled, ready for next phase | ⏳ |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| YouTube API key misconfigured | Low | High | Verify with a test curl request first |
| Go module dependency issues | Medium | Medium | Use `go mod tidy` after adding deps |
| GORM migration conflicts with existing DB | Low | Medium | Drop and recreate tables for dev |
| YouTube API quota exceeded during dev | Medium | High | Mock YouTube client for development |
| Type mismatch between Go structs and TypeScript types | Medium | Medium | Use shared type definitions as source of truth |

---

## Handoff to Next Phase

After M1 is complete and verified:
- **M2: Filters & Queue** — extends FilterPanel with remaining 7 filter components, queue with drag-drop, shuffle, repeat
- **M3: Accounts** — adds auth, persistence, share links
