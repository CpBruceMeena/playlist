# ✅ Master Task List: YouTube Smart Playlist Creator

**Consolidated from**: CEO Review (`ceo-review-output.md`) + Engineering Manager Review (`eng-manager-review.md`) + Implementation Architecture (`implementation-architecture.md`) + Detailed PRD (`detailed-prd.md`)

**Total Tasks**: ~120 | **Estimated Duration**: 6-7 weeks (32-38 dev days) | **Team**: 1 full-stack developer

---

## How to Use This List

1. Tasks are organized by **Phase** (M0 → M4) and then by **Category**
2. Check off tasks as you complete them using `[x]`
3. Each task has an estimated effort and dependencies listed
4. Track blockers and notes in the right column
5. Do one task at a time — start from the top and work down

---

## Phase 0: Setup — Pre-Development Prerequisites

> **Duration**: 1-2 days | **Owner**: You | **Dependencies**: None

### Account & Credentials Setup

- [ ] **P0.1** — Create YouTube Data API v3 key in Google Cloud Console
  - Effort: 15 min | Guide: Enable YouTube Data API v3, create API key, restrict to YouTube APIs
- [ ] **P0.1b** — Draft Privacy Policy (required by YouTube ToS + Google OAuth)
  - Effort: 1 hour | Reference: YouTube ToS Section 7(C), GDPR Article 13
  - Required before: P0.2 (Google requires privacy policy URL in OAuth consent screen)
- [ ] **P0.1c** — Define monetization hypothesis and pricing model document
  - Effort: 30 min | Output: 1-page doc answering: Who pays? How much? What value justifies it?
  - Reference: CEO Review condition #4 — hypothesis must exist even if deferred to v2
- [ ] **P0.1d** — Competitive analysis and differentiation strategy
  - Effort: 1 hour | Output: SWOT + positioning statement + moat strategy
  - Reference: CEO Review — "low competitive moat" flagged as critical risk
- [ ] **P0.2** — Create Google OAuth 2.0 credentials (Client ID + Secret)
  - Effort: 15 min | Guide: Create OAuth consent screen → Create OAuth 2.0 Web Client → Add authorized redirect URIs
  - Depends on: P0.1b (privacy policy needed for consent screen)
- [ ] **P0.3** — Create Vercel account and connect GitHub
  - Effort: 10 min | Free tier: 100GB bandwidth, 6k builds/month
- [ ] **P0.4** — Create Railway account and set up billing
  - Effort: 10 min | Free trial available, ~$5-10/month after
- [ ] **P0.5** — Create Cloudflare account for DNS + CDN
  - Effort: 5 min | Free tier
- [ ] **P0.6** — Create Sentry account for error tracking
  - Effort: 5 min | Free tier: 5k events/month
- [ ] **P0.7** — Set up PostHog (self-hosted or cloud) for analytics
  - Effort: 20 min | Self-hosted = free unlimited events

### Development Environment

- [ ] **P0.8** — Install Node.js 20 LTS
  - Effort: 10 min | `node -v` to verify
- [ ] **P0.9** — Install Docker Desktop (for local PostgreSQL)
  - Effort: 15 min | Or use Railway's local dev
- [ ] **P0.10** — Install VS Code extensions: ESLint, Prettier, Tailwind CSS IntelliSense, Prisma
  - Effort: 5 min
- [ ] **P0.11** — Create `.env.example` template and commit to repo
  - Effort: 10 min | Contains all env vars with placeholder values, no secrets
  - Output: `.env.example` file tracked in git for onboarding
- [ ] **P0.12** — Create `.env.local` files for all environment variables
  - Effort: 5 min | Copy `.env.example` → `.env.local`, fill in real values
  - Depends on: P0.11

### Domain & DNS

- [ ] **P0.13** — Register custom domain (e.g., `smartplaylist.app`)
  - Effort: 15 min | ~$10/year | Cloudflare Registrar or Namecheap
- [ ] **P0.14** — Configure Cloudflare DNS with proxied records
  - Effort: 15 min | Point to Vercel (frontend) and Railway (backend)

### Go/No-Go Checkpoint C0

- [ ] **P0.15** — 🟢 **Checkpoint C0: Pre-Development Verification**
  - Effort: 15 min | Review gate before starting M0
  - Checklist:
    - All P0.1-P0.14 tasks complete
    - API keys working (YouTube Data API returning results)
    - OAuth flow testable (Google consent screen configured)
    - Deployment pipelines connected (Vercel + Railway auto-deploy)
    - Privacy policy drafted
    - Monetization hypothesis documented
  - Decision: If all ✅, proceed to M0. If any ❌, resolve before continuing

---

## Phase M0: Foundation (Week 1 — 5 days)

> **Duration**: 5 days | **Dependencies**: P0.1-P0.13

### Day 1 — Monorepo & Skeleton Setup

- [ ] **M0.1** — Initialize monorepo with npm workspaces
  - Output: `package.json` with workspaces config | Dependencies: None
  - Files: `package.json` (root), `client/package.json`, `server/package.json`

- [ ] **M0.2** — Set up Vite + React + TypeScript (client)
  - Output: Client skeleton builds | Dependencies: M0.1
  - Command: `npm create vite@latest client -- --template react-ts`
  - Files: `client/src/main.tsx`, `client/vite.config.ts`, `client/tsconfig.json`

- [ ] **M0.3** — Install and configure Tailwind CSS (client)
  - Output: Tailwind works, test with a styled div | Dependencies: M0.2
  - Command: `npm install -D tailwindcss @tailwindcss/vite`
  - Files: `client/tailwind.config.ts`, `client/src/styles/globals.css`

- [ ] **M0.4** — Set up Express + TypeScript (server)
  - Output: Server skeleton with health check endpoint | Dependencies: M0.1
  - Files: `server/src/index.ts`, `server/src/app.ts`, `server/tsconfig.json`

- [ ] **M0.5** — Install Prisma + initialize schema (server)
  - Output: `prisma/schema.prisma` with initial models | Dependencies: M0.4
  - Files: `server/prisma/schema.prisma`

### Day 2 — Database & CI/CD

- [ ] **M0.6** — Create Prisma schema with User, Playlist, PlaylistVideo models
  - Output: Complete schema with indexes, relations, UUIDs | Dependencies: M0.5
  - Reference: `implementation-architecture.md §10.1`
  - Run: `npx prisma migrate dev --name init`

- [ ] **M0.7** — Set up GitHub CI/CD pipeline
  - Output: `.github/workflows/ci.yml` | Dependencies: M0.2, M0.4
  - Pipeline steps: Lint → Typecheck → Test → Build → Deploy
  - Files: `.github/workflows/ci.yml`

- [ ] **M0.8** — Deploy client skeleton to Vercel
  - Output: Staging URL for frontend | Dependencies: M0.6
  - Steps: Connect Vercel → GitHub repo → Auto-deploy

- [ ] **M0.9** — Deploy server skeleton to Railway
  - Output: Staging URL for backend API | Dependencies: M0.6
  - Steps: Connect Railway → GitHub repo → Add PostgreSQL plugin

- [ ] **M0.10** — Set up branch protection rules on GitHub
  - Output: `main` branch protected, require CI to pass | Dependencies: M0.7
  - Settings: Require PR review, require status checks, no direct pushes

### Day 3 — Shared Types & API Layer

- [ ] **M0.11** — Create shared types package
  - Output: `types/` package with shared interfaces | Dependencies: M0.1
  - Types: `Video`, `Playlist`, `FilterCriteria`, `User`, `ApiResponse<T>`, `ApiError`

- [ ] **M0.12** — Implement API client wrapper (frontend)
  - Output: `client/src/api/client.ts` | Dependencies: M0.11
  - Features: Auth header injection, token refresh, error parsing
  - Reference: `implementation-architecture.md §9.2`

- [ ] **M0.13** — Implement global error handler middleware (server)
  - Output: `server/src/middleware/errorHandler.ts` | Dependencies: M0.4
  - Features: `AppError` class, consistent error response format
  - Reference: `implementation-architecture.md §12.2`

- [ ] **M0.14** — Implement security headers middleware (server)
  - Output: `server/src/middleware/security.ts` | Dependencies: M0.4
  - Features: Helmet, CSP headers, CORS whitelist

- [ ] **M0.15** — Set up structured logging (server)
  - Output: `server/src/utils/logger.ts` | Dependencies: M0.4
  - Tool: Pino (lightweight, fast JSON logger)

### Day 4 — Stores & Routing

- [ ] **M0.16** — Install Zustand and create store shells
  - Output: 4 store files | Dependencies: M0.2
  - Files: `playerStore.ts`, `playlistStore.ts`, `filterStore.ts`, `authStore.ts`
  - Reference: `implementation-architecture.md §5.1`

- [ ] **M0.17** — Set up React Router with route structure
  - Output: Route configuration in `App.tsx` | Dependencies: M0.2
  - Routes: `/` (HomePage), `/playlist/:id` (PlaylistPage), `/my-playlists` (MyPlaylistsPage), `/p/:shareId` (SharedPlaylistPage)

- [ ] **M0.18** — Create UI primitive components
  - Output: `client/src/components/ui/` | Dependencies: M0.17
  - Components: Button, Input, Select, Toggle, Slider, Dialog, Chip, Spinner, Skeleton
  - Each component: TypeScript, Tailwind styled, accessible (aria attributes)

- [ ] **M0.19** — Create Toast notification system
  - Output: `Toast.tsx`, `ToastContainer.tsx` | Dependencies: M0.18
  - Features: Success/error/warning/info types, auto-dismiss, persistent option
  - Reference: `implementation-architecture.md §12.4`

- [ ] **M0.20** — Create ErrorBoundary component
  - Output: `ErrorBoundary.tsx` | Dependencies: M0.18
  - Features: Catch React errors, show ErrorState, Sentry integration

### Day 5 — Layout & Docker

- [ ] **M0.21** — Create layout components
  - Output: `Header.tsx`, `Footer.tsx`, `PageShell.tsx` | Dependencies: M0.18
  - Features: Header (logo + user menu), Footer (links), PageShell (responsive container)

- [ ] **M0.22** — Create LoadingSkeleton, EmptyState, ErrorState components
  - Output: Feedback components | Dependencies: M0.18
  - Features: Pulsing skeletons for playlist cards, empty state with illustration, error state with retry

- [ ] **M0.23** — Set up Docker Compose for local PostgreSQL
  - Output: `docker-compose.yml` | Dependencies: None
  - Service: PostgreSQL 15 on port 5432, persistent volume

- [ ] **M0.24** — Write seed data script for development
  - Output: `server/prisma/seed.ts` | Dependencies: M0.6
  - Seeds: Test user, sample playlists, sample videos

- [ ] **M0.25** — Write initial tests (smoke tests)
  - Output: Server smoke test, client smoke test | Dependencies: M0.2, M0.4
  - Tests: Server returns 200 on health check, client renders without crash

---

## Phase M1: Core Generation (Week 2-3 — 8 days)

> **Duration**: 8 days | **Dependencies**: M0 complete

### Day 6 — YouTube API Integration (Server)

- [ ] **M1.1** — Implement YouTube API client service
  - Output: `server/src/services/youtube.service.ts` | Dependencies: M0.4
  - Functions: `searchVideos(query, params)`, `getVideoDetails(ids[])`, `parseISO8601Duration()`
  - Error handling: Network errors, invalid API key, rate limit responses

- [ ] **M1.2** — Implement filter service (duration + keyword filters)
  - Output: `server/src/services/filter.service.ts` | Dependencies: M1.1
  - Functions: `applyFilters(videos, criteria)`, `byDuration()`, `byIncludeKeywords()`, `byExcludeKeywords()`
  - Reference: `implementation-architecture.md §6.2`

- [ ] **M1.3** — Implement video type classification
  - Output: Inside `filter.service.ts` | Dependencies: M1.2
  - Function: `classifyVideoType(video)` → music/live/shorts/standard
  - Reference: `implementation-architecture.md §6.3`

### Day 7 — Generate API Endpoint

- [ ] **M1.4** — Implement `/api/v1/generate` endpoint
  - Output: `generate.controller.ts`, `generate.routes.ts` | Dependencies: M1.2, M1.3
  - Features: Input validation, API call → filter → return, error handling
  - Reference: `implementation-architecture.md §9.1`

- [ ] **M1.5** — Implement rate limiting middleware
  - Output: `server/src/middleware/rateLimiter.ts` | Dependencies: M0.4
  - Config: 10 req/min per IP, 50 req/min per authenticated user
  - Library: `express-rate-limit`

- [ ] **M1.6** — Implement request validation middleware
  - Output: `server/src/middleware/validate.ts` | Dependencies: M0.4
  - Library: Zod (schema validation for all endpoints)
  - Schemas: GenerateRequest, CreatePlaylistRequest, AuthCallbackRequest

- [ ] **M1.7** — Implement YouTube quota tracking utility
  - Output: `server/src/utils/youtubeQuota.ts` | Dependencies: M1.1
  - Features: Track units per request, log daily usage, alert at 80%

### Day 8 — Search UI Components

- [ ] **M1.8** — Build SearchInput component
  - Output: `SearchInput.tsx` | Dependencies: M0.18
  - Features: Autofocus, placeholder text, Enter to submit, validation

- [ ] **M1.9** — Build Generate button + Form integration
  - Output: Update `HomePage.tsx` | Dependencies: M1.8
  - Features: Button disabled while generating, loading state

- [ ] **M1.10** — Build FilterPanel skeleton (collapsible)
  - Output: `FilterPanel.tsx` | Dependencies: M0.18
  - Features: Collapsible panel, active filter count badge, "N filters applied" text

- [ ] **M1.11** — Build DurationSlider component
  - Output: `DurationSlider.tsx` | Dependencies: M0.18
  - Features: Preset buttons (<4min, 4-20min, >20min) + custom min/max inputs

### Day 9 — Stores & API Integration

- [ ] **M1.12** — Build filterStore with all filter state
  - Output: `filterStore.ts` | Dependencies: M0.16
  - Features: All filter fields, `setFilter()`, `resetFilters()`, `getFilterPayload()`

- [ ] **M1.13** — Generate API function
  - Output: `client/src/api/generate.ts` | Dependencies: M0.12
  - Function: `generatePlaylist(query, filters)` → `POST /api/v1/generate`

- [ ] **M1.14** — Build playlistStore (generate action)
  - Output: `playlistStore.ts` | Dependencies: M0.16, M1.13
  - Actions: `generatePlaylist()`, loading/error states, navigation on success

### Day 10 — HomePage + Feedback Components

- [ ] **M1.15** — Build complete HomePage with search + generate flow
  - Output: `HomePage.tsx` | Dependencies: M1.8-M1.14
  - Features: Search input + filter panel + generate button + result display
  - States: Initial (empty), generating (skeleton), results (navigate), error (show)

- [ ] **M1.16** — Build LoadingSkeleton with pulsing placeholders
  - Output: `LoadingSkeleton.tsx` | Dependencies: M0.22
  - Design: 6 pulsing card placeholders with thumbnail + text lines

- [ ] **M1.17** — Build EmptyState component with suggestions
  - Output: `EmptyState.tsx` | Dependencies: M0.22
  - Features: Illustration, message, suggestion chips (clickable search examples)

- [ ] **M1.18** — Build ErrorState component with retry
  - Output: `ErrorState.tsx` | Dependencies: M0.22
  - Features: Error icon, message, retry button, contextual help text

### Day 11 — YouTube Player Integration

- [ ] **M1.19** — Implement `useYouTubePlayer` hook
  - Output: `useYouTubePlayer.ts` | Dependencies: None
  - Features: Load IFrame API, create player, lifecycle management, cleanup on unmount
  - Reference: `implementation-architecture.md §7.2`

- [ ] **M1.20** — Build YouTubePlayer component
  - Output: `YouTubePlayer.tsx` | Dependencies: M1.19
  - Features: Container div, player initialization, responsive sizing

### Day 12 — Player Controls & Auto-Advance

- [ ] **M1.21** — Build basic player controls (play/pause/skip)
  - Output: `PlayerControls.tsx` | Dependencies: M1.20
  - Buttons: Play/Pause (toggle), Skip (next), Previous (back)

- [ ] **M1.22** — Implement auto-advance logic
  - Output: Update `playerStore.ts` + `YouTubePlayer.tsx` | Dependencies: M1.21
  - Logic: `onStateChange=ENDED` → `playerStore.next()` → `player.loadVideoById(nextId)`

- [ ] **M1.23** — Build basic PlaylistPage layout
  - Output: `PlaylistPage.tsx` | Dependencies: M1.20, M1.21
  - Layout: Left = player, Right = queue (placeholder), Header = back/save/share

- [ ] **M1.24** — Test end-to-end: generate → play → auto-advance
  - Output: Manual test + integration test | Dependencies: All M1 tasks

### Day 13 — M1 Integration & Deploy

- [ ] **M1.25** — Write unit tests for filter service
  - Output: `filter.service.test.ts` | Dependencies: M1.2
  - Tests: Each filter function, combined pipeline, edge cases

- [ ] **M1.26** — Write integration tests for generate API
  - Output: `generate.test.ts` | Dependencies: M1.4
  - Tests: Valid request, invalid query, rate limiting, quota error

- [ ] **M1.27** — Set up YouTube API mock for development
  - Output: Mock responses for offline development | Dependencies: M1.1
  - Tool: MSW (Mock Service Worker) or manual mock data

- [ ] **M1.28** — Deploy M1 to staging and verify
  - Output: Working staging environment | Dependencies: All M1 tasks
  - Verify: Generate a playlist, play it, auto-advance works

---

## Phase M2: Filters & Queue (Week 3-4 — 6 days)

> **Duration**: 6 days | **Dependencies**: M1 complete

### Day 14 — Remaining Filter UI

- [ ] **M2.1** — Build VideoTypeCheckbox component
  - Output: `VideoTypeCheckbox.tsx` | Dependencies: M0.18
  - Options: Music 🎵, Live 📡, Shorts 📱, Standard 📺 (all default on)

- [ ] **M2.2** — Build KeywordInput component (include + exclude)
  - Output: `KeywordInput.tsx` | Dependencies: M0.18
  - Features: Comma-separated input, chip display, remove individual keyword

- [ ] **M2.3** — Build UploadDateSelect component
  - Output: `UploadDateSelect.tsx` | Dependencies: M0.18
  - Options: Any time, Last week, Last month, Last year, Custom range

- [ ] **M2.4** — Build ViewCountInput component
  - Output: `ViewCountInput.tsx` | Dependencies: M0.18
  - Features: Number input with "k" suffix (e.g., "100k" = 100,000)

- [ ] **M2.5** — Build MaxResultsSlider component
  - Output: `MaxResultsSlider.tsx` | Dependencies: M0.18
  - Range: 10-50, default 25, with current value display

- [ ] **M2.6** — Build SafeSearchToggle component
  - Output: `SafeSearchToggle.tsx` | Dependencies: M0.18
  - Design: Toggle switch, ON = safe search, OFF = unrestricted

- [ ] **M2.7** — Integrate all filter components into FilterPanel
  - Output: Complete `FilterPanel.tsx` | Dependencies: M2.1-M2.6
  - Features: Apply button, Reset button, active filter count badge

### Day 15 — Queue UI & Drag-Drop

- [ ] **M2.8** — Build QueueList + QueueItem components
  - Output: `QueueList.tsx`, `QueueItem.tsx` | Dependencies: M1.23
  - Features: Scrollable list, now playing indicator, thumbnail + title + channel + duration

- [ ] **M2.9** — Implement drag-and-drop reorder
  - Output: `DragHandle.tsx` + update QueueList | Dependencies: M2.8
  - Library: `@dnd-kit/core` (modern, lightweight) or HTML5 DnD
  - Accessibility: Also support move up/down buttons for keyboard users

- [ ] **M2.10** — Build DragHandle component
  - Output: `DragHandle.tsx` | Dependencies: M2.9
  - Design: ≡ drag icon, visible on hover, accessible grab cursor

### Day 16 — Shuffle, Repeat & Progress

- [ ] **M2.11** — Implement Shuffle (Fisher-Yates algorithm)
  - Output: Update `playerStore.ts` | Dependencies: M0.16
  - Logic: Shuffle on toggle, no duplicates, preserve original order for repeat

- [ ] **M2.12** — Build QueueControls (Shuffle + Repeat buttons)
  - Output: `QueueControls.tsx` | Dependencies: M2.11
  - Features: Shuffle toggle (🔀), Repeat toggle (🔁), active state styling

- [ ] **M2.13** — Implement Repeat mode (loop queue)
  - Output: Update `playerStore.ts` | Dependencies: M2.11
  - Modes: None (stop at end), All (loop entire queue)

### Day 17 — Progress Bar & Volume

- [ ] **M2.14** — Build ProgressBar component
  - Output: `ProgressBar.tsx` | Dependencies: M1.20
  - Features: Current time / total time display, clickable seek, smooth update every 250ms

- [ ] **M2.15** — Build VolumeControl component
  - Output: `VolumeControl.tsx` | Dependencies: M1.20
  - Features: Speaker icon (mute/unmute), slider (0-100), persists across videos

- [ ] **M2.16** — Implement Previous button with playback history
  - Output: Update `playerStore.ts` | Dependencies: M2.11
  - Logic: Stack of played indices, previous pops the stack

### Day 18 — Integration Tests

- [ ] **M2.17** — Write unit tests for full filter pipeline
  - Output: Expanded `filter.service.test.ts` | Dependencies: M1.2
  - Tests: All filter types combined, edge cases (no results, all filtered out)

- [ ] **M2.18** — Test queue operations (add, remove, reorder, shuffle)
  - Output: Queue component tests | Dependencies: M2.8-M2.12
  - Tests: Drag reorder fires correct action, shuffle produces valid order

### Day 19 — M2 Deploy

- [ ] **M2.19** — Deploy M2 to staging and verify
  - Output: Staging with full filters + queue | Dependencies: All M2 tasks
  - Verify: All 8 filters work, queue reorder, shuffle, repeat, progress bar

---

## Phase M3: Save & Share Playlists (LocalStorage) — ✅ Complete

> **Duration**: 2 days | **Dependencies**: M2 complete
>
> **Note**: Original M3 (Accounts with Google OAuth, My Playlists page, Shared Playlist) put **ON HOLD**. Auth (OAuth) is deferred indefinitely. YouTube Export (M3.5) requires OAuth and is also on hold.
>
> **What we built**: localStorage-based playlist persistence with save dialog, My Playlists page, load/delete. Full spec at `cabinet/cpo/feature-manager/feature-m3-save-share/`.

### Completed Tasks

- [x] **M3.1** — Build `savedPlaylistsStore.ts` (Zustand + localStorage)
  - File: `frontend/src/stores/savedPlaylistsStore.ts`
  - Features: CRUD operations, localStorage persistence, max 50 playlists, storage error handling

- [x] **M3.2** — Build SavedPlaylistCard component (inline in MyPlaylistsPage)
  - Thumbnail collage, video count badge, name, date, Load/Delete buttons

- [x] **M3.3** — Build MyPlaylistsPage (localStorage-based)
  - File: `frontend/src/pages/MyPlaylistsPage.tsx`
  - Features: Saved playlist list with Load/Delete, loading state, EmptyState fallback

- [x] **M3.4** — Build save dialog with name prompt
  - Inline in `PlaylistPage.tsx`: modal overlay with Input + confirm/cancel
  - Keyboard: Enter to save, Escape to close

- [x] **M3.5** — Playlist loading from localStorage
  - Flow: Click Load → initQueue(savedVideos) → navigate to /playlist → toast confirmation

- [x] **M3.6** — "My Playlists" link in Header
  - Already existed from M0.17 — confirmed working

### Blocked (Requires OAuth)

- [ ] **M3.7-M3.9** — YouTube Export — BLOCKED (requires OAuth re-introduction)
  - See `cabinet/cpo/feature-manager/feature-m3-youtube-export/plan.md`

---

## Phase M3.5: YouTube Export & Video Publish (Future — Post-MVP)

> **Duration**: ~14 days | **Dependencies**: M3 completed, Auth re-implemented
> **Status**: 🔵 DEFERRED to v1.5
>
> See `cabinet/cpo/feature-manager/feature-m3-youtube-export/plan.md` for full CPO analysis.

### YouTube Export (Requires Auth)

- [ ] **M3.5.1** — Implement YouTube OAuth with youtube.force-ssl scope
  - Effort: 2 days | Depends: Auth re-implementation
  - Endpoints: OAuth flow, token storage for YouTube API calls

- [ ] **M3.5.2** — Export playlist to YouTube account
  - Effort: 2 days | Depends: M3.5.1
  - YouTube API: `playlists.insert`, `playlistItems.insert`
  - UI: Export button on PlaylistPage, progress state, success toast

### Video Merge (No Auth Needed — but ToS Risk)

- [ ] **M3.5.3** — Research legal/compliance for YouTube video downloading
  - Effort: 1 day | **Must complete before implementation**
  - Validate: YouTube ToS, DMCA compliance, copyright fair use

- [ ] **M3.5.4** — Implement FFmpeg video merge pipeline (server-side)
  - Effort: 5 days | Depends: Legal clearance
  - Components: Download videos, concat demuxer, progress tracking, cleanup

- [ ] **M3.5.5** — Build merge UI (progress, cancel, result)
  - Effort: 2 days | Depends: M3.5.4
  - UI: Merge button, async progress bar, cancel button, result download/play

### Publish to YouTube (Requires Auth)

- [ ] **M3.5.6** — Upload merged video to YouTube account
  - Effort: 2 days | Depends: M3.5.1, M3.5.4
  - YouTube API: `videos.insert` (resumable upload)
  - UI: Upload progress, metadata form (title, description, privacy)

---

## Phase M4: Polish (Week 5-6 — 6 days)

> **Duration**: 6 days | **Dependencies**: M1-M3 complete

### Day 27 — Caching

- [ ] **M4.1** — Implement server-side LRU cache
  - Output: `server/src/utils/cache.ts` | Dependencies: M1.1
  - Cache layers: Search results (30 min), generated playlists (5 min)
  - Library: `lru-cache`
  - Reference: `implementation-architecture.md §11.3`

- [ ] **M4.2** — Implement client-side cache (localStorage)
  - Output: `client/src/utils/cache.ts` | Dependencies: M0.2
  - Features: 5-min TTL, hash-based key, auto-cleanup on full storage
  - Reference: `implementation-architecture.md §11.2`

### Day 28 — Error States & Responsive

- [ ] **M4.3** — Build all screen-level error states
  - Output: Error variants for each page | Dependencies: M1.18
  - States: No results (homepage), quota exceeded, network error, video unavailable, auth required

- [ ] **M4.4** — Build all screen-level empty states
  - Output: Empty variants for each page | Dependencies: M1.17
  - States: No playlists (My Playlists page), empty queue (Playlist page), no search results (Homepage)

- [ ] **M4.5** — Implement mobile responsive layout
  - Output: CSS media queries across all pages | Dependencies: All pages
  - Breakpoints: ≥1024px (desktop side-by-side), 768-1023px (tablet stacked), <768px (mobile bottom sheet)
  - Reference: `detailed-prd.md §5.3`

### Day 29 — Accessibility

- [ ] **M4.6** — Add keyboard navigation to all interactive elements
  - Output: Pass WCAG 2.1.1 (Keyboard) | Dependencies: All pages
  - Elements: Player controls, queue items, filter inputs, buttons, links

- [ ] **M4.7** — Add ARIA labels to all icon-only buttons
  - Output: Pass WCAG 4.1.2 (Name, Role, Value) | Dependencies: All pages
  - Elements: Play, pause, skip, shuffle, repeat, volume, drag handle, share

- [ ] **M4.8** — Add focus indicators (visible focus ring)
  - Output: Pass WCAG 2.4.7 (Focus Visible) | Dependencies: All pages
  - Design: 3:1 contrast ratio focus ring on all interactive elements

- [ ] **M4.9** — Implement skip-to-content link
  - Output: Skip link at top of page | Dependencies: M0.21
  - Behavior: Visible on Tab press, hidden otherwise, jumps to main content

- [ ] **M4.10** — Add ARIA live regions for dynamic updates
  - Output: Pass WCAG 4.1.3 (Status Messages) | Dependencies: All pages
  - Use: `aria-live="polite"` on queue updates, `aria-live="assertive"` on errors

- [ ] **M4.11** — Add alt text to all thumbnails and images
  - Output: Pass WCAG 1.1.1 (Non-text Content) | Dependencies: All pages
  - Format: `"Thumbnail for {title} by {channel}"`

- [ ] **M4.12** — Implement reduced motion support
  - Output: Pass WCAG 2.3.3 (Animation from Interactions) | Dependencies: All pages
  - CSS: `@media (prefers-reduced-motion: reduce)` → disable animations

- [ ] **M4.13** — Add move up/down buttons for drag-and-drop alternative
  - Output: Pass WCAG 2.5.1 (Pointer Gestures) | Dependencies: M2.9
  - Feature: Keyboard-accessible queue reorder via buttons

### Day 30 — Monitoring & Performance

- [ ] **M4.14** — Set up Sentry error tracking (client + server)
  - Output: Sentry configuration | Dependencies: All features
  - Client: `@sentry/react` for React error tracking
  - Server: `@sentry/node` for API error tracking
  - Endpoint: `POST /api/v1/sentry/tunnel` for CSP-compliant reporting

- [ ] **M4.15** — Set up PostHog analytics
  - Output: Analytics events across all pages | Dependencies: All features
  - Events: generate_playlist, play_video, skip_video, save_playlist, share_playlist, sign_in

- [ ] **M4.16** — Code splitting with lazy loading
  - Output: Reduced initial bundle size | Dependencies: All pages
  - Split: HomePage, PlaylistPage, MyPlaylistsPage, SharedPlaylistPage each in separate chunks

- [ ] **M4.17** — Bundle analysis and optimization
  - Output: Initial JS bundle <150KB | Dependencies: M4.16
  - Tool: Vite bundle analysis (`vite build --analyze`)

### Day 31 — Lighthouse Audit & E2E

- [ ] **M4.18** — Run Lighthouse audit and fix issues
  - Output: All Lighthouse scores >90 | Dependencies: M4.5-M4.13
  - Metrics: Performance >90, Accessibility >95, Best Practices >95, SEO >90

- [ ] **M4.19** — Write E2E tests for 5 critical user flows
  - Output: Cypress tests | Dependencies: All features
  - Flows: (1) Generate + play, (2) Apply filters + regenerate, (3) Sign in + save playlist, (4) Share + load shared, (5) Guest mode + import

- [ ] **M4.20** — Final security checklist verification
  - Output: Security checklist complete | Dependencies: None
  - Checklist: See `implementation-architecture.md Appendix B`

### Day 32 — Production Launch

- [ ] **M4.21** — Production deployment (Vercel + Railway)
  - Output: Production environment live | Dependencies: All M4 tasks
  - Steps: Deploy to production branch → verify all features → enable custom domain

- [ ] **M4.22** — Configure monitoring dashboards
  - Output: Active monitoring | Dependencies: M4.14, M4.15
  - Dashboards: Sentry (errors), PostHog (analytics), Better Uptime (uptime), Railway (server metrics)

- [ ] **M4.23** — Set up daily YouTube API quota alert at 80%
  - Output: Automated email alert | Dependencies: M1.7
  - Tool: Google Cloud Console budget alerts or custom script

---

## Post-Launch Tasks (Month 1-3)

> **Owner**: Developer + PM | **Duration**: Ongoing after launch

### Launch & Marketing

- [ ] **PL.1** — Launch on Product Hunt
  - Effort: 2 hours | Guide: Prepare landing page, screenshots, demo video, launch post
  - Reference: CEO Review GTM recommendation

- [ ] **PL.2** — Create SEO-optimized content
  - Effort: 4 hours | Keywords: "youtube playlist generator", "auto youtube playlist", "smart playlist maker"
  - Tactics: Blog post, meta tags on homepage, sitemap submission

- [ ] **PL.3** — Post on relevant Reddit communities
  - Effort: 1 hour | Subreddits: r/InternetIsBeautiful, r/YouTube, r/playlists, r/SideProject
  - Note: Follow each subreddit's self-promotion rules

- [ ] **PL.4** — Enable viral sharing (branded share links)
  - Effort: 2 hours | Add "Made with YouTube Smart Playlist Creator" footer on shared playlists

### Monitoring & Checkpoints

- [ ] **PL.5** — Track success metrics dashboard
  - Effort: Ongoing | Metrics: Time to first playlist (<30s), Completion rate (>60%), API quota per gen (<150 units), Guest → Signup (>20%), MAU (target: 1,000 by month 3)

- [ ] **PL.6** — **Checkpoint C1 (Month 1)**: Review MAU and engagement
  - Criteria: If MAU < 200, evaluate GTM strategy pivot

- [ ] **PL.7** — **Checkpoint C2 (Month 3)**: Go/No-Go decision
  - Criteria: If MAU < 500, consider sunsetting. If MAU > 500, continue with v1.5 features.

### V1.5 Backlog (Post-MVP Features)

- [ ] **PL.8** — Manual add/remove videos after generation
  - Effort: 2 days | Value: High (most requested feature)

- [ ] **PL.9** — User playlist history (view recently played)
  - Effort: 1 day | Value: Medium

- [ ] **PL.10** — Playlist rename and edit
  - Effort: 1 day | Value: Medium

- [ ] **PL.11** — Export playlist to YouTube account (via OAuth)
  - Effort: 3 days | Value: High (requires additional YouTube OAuth scopes)

- [ ] **PL.12** — Premium tier (freemium monetization)
  - Effort: 3 days | Value: Revenue generation
  - Features: Unlimited playlists, advanced filters, ad-free

- [ ] **PL.13** — Embeddable playlist widget
  - Effort: 2 days | Value: Growth (users embed on blogs → more exposure)

- [ ] **PL.14** — Invidious API as fallback (reduce YouTube dependency)
  - Effort: 2 days | Value: Risk mitigation

---

## Appendix: Task Summary by Phase

| Phase | Tasks | Days | Effort (Dev Days) | Status |
|-------|-------|------|-------------------|--------|
| **P0: Setup** | 15 | 2 | 2.5 | ✅ Complete |
| **M0: Foundation** | 25 | 5 | 5 | ✅ Complete |
| **M1: Core Generation** | 28 | 8 | 8 | ✅ Complete |
| **M2: Filters & Queue** | 19 | 6 | 6 | ✅ Complete |
| **M3: Save & Share (LocalStorage)** | 6 | 2 | 2 | ✅ Complete |
| **M3.5: YouTube Export & Publish** | 6 | ~14 | ~14 | 🔵 Deferred (v1.5) |
| **M4: Polish** | 23 | 6 | 6 | 🔵 Future |
| **Post-Launch** | 14 | Ongoing | ~10 | 🔵 Future |
| **Total** | **~144** | **~32 days** | **~33.5 dev days** | |

---

## Appendix: Quick Reference Links

| Resource | Link |
|----------|------|
| Architecture Decisions | `implementation-architecture.md §1.2` |
| Directory Structure | `implementation-architecture.md §2` |
| Component Tree | `implementation-architecture.md §3` |
| Data Flow Diagrams | `implementation-architecture.md §4` |
| Zustand Store Designs | `implementation-architecture.md §5` |
| Filter Pipeline | `implementation-architecture.md §6` |
| Player Integration | `implementation-architecture.md §7` |
| OAuth Flow | `implementation-architecture.md §8` |
| Full API Spec | `implementation-architecture.md §9` |
| Prisma Schema | `implementation-architecture.md §10` |
| Caching Strategy | `implementation-architecture.md §11` |
| Error Handling | `implementation-architecture.md §12` |
| Testing Strategy | `implementation-architecture.md §13` |
| Deployment Config | `implementation-architecture.md §14` |
| Tech Stack | `detailed-prd.md §4.2` |
| DB Schema | `detailed-prd.md §4.3` |
| UI Mockups | `detailed-prd.md §5.1` |
| Success Metrics | `detailed-prd.md §7` |
| Coding Standards | `eng-manager-review.md §4` |
| Risk Register | `eng-manager-review.md §6` |
| Go/No-Go Checkpoints | `eng-manager-review.md §6.2` |
