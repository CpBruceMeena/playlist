# 🏗️ Implementation Design & Architecture
## YouTube Smart Playlist Creator v1.0

**Version**: 1.0  
**Date**: May 29, 2026  
**Author**: Architecture Team  
**Status**: DRAFT — Pending Engineering Manager Review

---

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Directory Structure](#2-directory-structure)
3. [Component Tree](#3-component-tree)
4. [Data Flow Architecture](#4-data-flow-architecture)
5. [State Management Design](#5-state-management-design)
6. [Filter Pipeline Architecture](#6-filter-pipeline-architecture)
7. [YouTube Player Integration](#7-youtube-player-integration)
8. [Authentication Flow](#8-authentication-flow)
9. [API Layer Design](#9-api-layer-design)
10. [Database Schema & Migrations](#10-database-schema--migrations)
11. [Caching Strategy](#11-caching-strategy)
12. [Error Handling Strategy](#12-error-handling-strategy)
13. [Testing Strategy](#13-testing-strategy)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Implementation Order (Build Sequence)](#15-implementation-order-build-sequence)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                              │
│                                                                      │
│  ┌─────────────────────────┐    ┌────────────────────────────┐      │
│  │     React SPA (Vite)     │    │   YouTube IFrame Player    │      │
│  │     TypeScript 5.x       │    │   (sandboxed iframe)       │      │
│  │     Tailwind CSS 3.x     │    │                            │      │
│  └───────────┬─────────────┘    └───────────┬────────────────┘      │
│              │                              │                        │
│              │  HTTP/HTTPS                  │  postMessage API       │
│              │  (REST JSON)                 │  (cross-origin)        │
└──────────────┼──────────────────────────────┼────────────────────────┘
               │                              │
               ▼                              │
┌──────────────────────────────┐              │
│     Node.js/Express 20 LTS    │              │
│     API Server                │              │
│                              │              │
│  ┌────────────────────────┐  │              │
│  │  YouTube API Proxy      │  │              │
│  │  (API key server-side)  │  │              │
│  │  + Rate Limiting        │  │              │
│  └───────────┬────────────┘  │              │
│              │               │              │
│  ┌───────────┴────────────┐  │              │
│  │  Playlist Service       │  │              │
│  │  (CRUD + Search Logic)  │  │              │
│  └───────────┬────────────┘  │              │
│              │               │              │
│  ┌───────────┴────────────┐  │              │
│  │  Auth Service           │  │              │
│  │  (JWT + Google OAuth)   │  │              │
│  └───────────┬────────────┘  │              │
└──────────────┼───────────────┘              │
               │                              │
               ▼                              ▼
┌──────────────────────┐    ┌──────────────────────────┐
│   PostgreSQL 15+      │    │  YouTube Data API v3     │
│   (Railway)           │    │  (External Service)      │
│                       │    │                          │
│  - users              │    │  - search.list           │
│  - playlists          │    │  - videos.list           │
│  - playlist_videos    │    │  - captions (future)     │
└──────────────────────┘    └──────────────────────────┘
```

### 1.2 Architecture Decisions (ADRs)

| ADR | Decision | Rationale |
|-----|----------|-----------|
| **ADR-1** | React SPA over SSR | No SEO requirement for core app. Share links use OG tags via API server. Simpler deployment (static hosting). |
| **ADR-2** | Zustand over Redux | Smaller bundle (~1KB vs ~12KB). Simpler API. Sufficient for this scale. Zustand's subscribe-with-selector pattern matches player state needs. |
| **ADR-3** | Express over Next.js | Lighter backend. SPA + API separation allows independent scaling. YouTube API proxy doesn't need React server features. |
| **ADR-4** | PostgreSQL over MongoDB | Playlist data is relational (users → playlists → videos). ACID compliance matters for playlist integrity. Prisma ORM provides type safety. |
| **ADR-5** | Server-side API key over client-side | YouTube API key would be exposed in client bundle. Server proxy keeps it secure and allows caching/filtering server-side. |
| **ADR-6** | Railway for MVP hosting | Simple deployment (Git push → deploy). PostgreSQL add-on included. Scales to ~1000 users before needing migration. |
| **ADR-7** | JWT over session-based auth | Stateless. Works well with SPA. Short-lived tokens (15min) + refresh tokens balance security and UX. |
| **ADR-8** | YouTube IFrame Player API over custom player | YouTube ToS requires their player for streaming. Provides native controls, ads handling (if applicable), and consistent UI. |

---

## 2. Directory Structure

```
youtube-smart-playlist-creator/
├── client/                              # React SPA (Vite)
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── og-image.png                 # Open Graph default image
│   │   └── robots.txt
│   ├── src/
│   │   ├── main.tsx                     # Entry point
│   │   ├── App.tsx                      # Root component + routing
│   │   ├── routes/
│   │   │   ├── HomePage.tsx             # Search + filter UI
│   │   │   ├── PlaylistPage.tsx         # Player + queue view
│   │   │   ├── MyPlaylistsPage.tsx      # Saved playlists grid
│   │   │   └── SharedPlaylistPage.tsx   # Public share link view
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── PageShell.tsx
│   │   │   ├── search/
│   │   │   │   ├── SearchInput.tsx
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   ├── FilterChip.tsx
│   │   │   │   ├── DurationSlider.tsx
│   │   │   │   ├── VideoTypeCheckbox.tsx
│   │   │   │   ├── KeywordInput.tsx
│   │   │   │   ├── UploadDateSelect.tsx
│   │   │   │   ├── ViewCountInput.tsx
│   │   │   │   ├── MaxResultsSlider.tsx
│   │   │   │   └── SafeSearchToggle.tsx
│   │   │   ├── player/
│   │   │   │   ├── YouTubePlayer.tsx    # IFrame Player wrapper
│   │   │   │   ├── PlayerControls.tsx   # Play/pause/skip/prev
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   ├── VolumeControl.tsx
│   │   │   │   └── PlayerOverlay.tsx    # Error/loading overlays
│   │   │   ├── queue/
│   │   │   │   ├── QueueList.tsx
│   │   │   │   ├── QueueItem.tsx
│   │   │   │   ├── QueueControls.tsx    # Shuffle, repeat buttons
│   │   │   │   └── DragHandle.tsx
│   │   │   ├── playlist/
│   │   │   │   ├── PlaylistCard.tsx     # Grid card for saved playlists
│   │   │   │   ├── PlaylistGrid.tsx
│   │   │   │   ├── PlaylistMeta.tsx     # Name, video count, duration
│   │   │   │   └── ShareButton.tsx
│   │   │   ├── auth/
│   │   │   │   ├── GoogleSignInButton.tsx
│   │   │   │   ├── AuthModal.tsx
│   │   │   │   └── UserMenu.tsx
│   │   │   ├── feedback/
│   │   │   │   ├── Toast.tsx
│   │   │   │   ├── ToastContainer.tsx
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   ├── LoadingSkeleton.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   └── ErrorState.tsx
│   │   │   └── ui/                     # Primitive UI components
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Select.tsx
│   │   │       ├── Toggle.tsx
│   │   │       ├── Slider.tsx
│   │   │       ├── Dialog.tsx
│   │   │       ├── Chip.tsx
│   │   │       ├── Spinner.tsx
│   │   │       └── Skeleton.tsx
│   │   ├── hooks/
│   │   │   ├── useYouTubePlayer.ts     # Player lifecycle hook
│   │   │   ├── usePlaylistGenerator.ts # Generate + filter logic
│   │   │   ├── useAuth.ts              # Auth state + actions
│   │   │   ├── useLocalStorage.ts      # Guest mode persistence
│   │   │   ├── useDebounce.ts
│   │   │   ├── useMediaQuery.ts
│   │   │   └── useKeyboardShortcuts.ts
│   │   ├── stores/
│   │   │   ├── playerStore.ts          # Zustand: player state
│   │   │   ├── playlistStore.ts        # Zustand: current playlist
│   │   │   ├── filterStore.ts          # Zustand: filter state
│   │   │   └── authStore.ts            # Zustand: auth state
│   │   ├── api/
│   │   │   ├── client.ts               # Axios/fetch wrapper
│   │   │   ├── generate.ts             # POST /api/v1/generate
│   │   │   ├── playlists.ts            # CRUD /api/v1/playlists
│   │   │   ├── auth.ts                 # POST /api/v1/auth/google
│   │   │   └── types.ts                # API request/response types
│   │   ├── utils/
│   │   │   ├── formatDuration.ts
│   │   │   ├── formatViewCount.ts
│   │   │   ├── shareUtils.ts
│   │   │   ├── validation.ts
│   │   │   └── constants.ts
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── animations.css
│   │   └── types/
│   │       ├── youtube.ts              # YouTube Data API types
│   │       ├── playlist.ts             # Domain types
│   │       ├── filters.ts              # Filter types
│   │       └── user.ts                 # User/auth types
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── package.json
│
├── server/                              # Node.js/Express API
│   ├── src/
│   │   ├── index.ts                     # Entry point + Express setup
│   │   ├── app.ts                       # App configuration
│   │   ├── config/
│   │   │   ├── env.ts                   # Environment variables
│   │   │   └── cors.ts                  # CORS configuration
│   │   ├── routes/
│   │   │   ├── index.ts                 # Route aggregator
│   │   │   ├── generate.routes.ts
│   │   │   ├── playlists.routes.ts
│   │   │   └── auth.routes.ts
│   │   ├── controllers/
│   │   │   ├── generate.controller.ts
│   │   │   ├── playlists.controller.ts
│   │   │   └── auth.controller.ts
│   │   ├── services/
│   │   │   ├── youtube.service.ts       # YouTube API client
│   │   │   ├── filter.service.ts        # Server-side filter logic
│   │   │   ├── playlist.service.ts      # Playlist CRUD
│   │   │   └── auth.service.ts          # OAuth + JWT logic
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts       # JWT verification
│   │   │   ├── rateLimiter.ts           # Rate limiting
│   │   │   ├── validate.ts              # Request validation
│   │   │   ├── errorHandler.ts          # Global error handler
│   │   │   └── security.ts              # Security headers
│   │   ├── models/                      # Prisma types re-exports
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── youtubeQuota.ts          # Quota tracking
│   │   │   ├── logger.ts               # Winston/Pino logger
│   │   │   └── errors.ts               # Custom error classes
│   │   └── types/
│   │       ├── express.d.ts            # Express type extensions
│   │       └── responses.ts            # API response types
│   ├── prisma/
│   │   ├── schema.prisma               # Database schema
│   │   ├── migrations/                 # Auto-generated migrations
│   │   └── seed.ts                     # Seed data for dev
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── filter.service.test.ts
│   │   │   ├── playlist.service.test.ts
│   │   │   └── youtube.service.test.ts
│   │   └── integration/
│   │       ├── generate.test.ts
│   │       └── playlists.test.ts
│   ├── .env.example
│   ├── tsconfig.json
│   ├── jest.config.ts
│   └── package.json
│
├── .github/
│   ├── workflows/
│   │   └── ci.yml                      # CI/CD pipeline
│   ├── pull_request_template.md
│   ├── SECURITY.md
│   └── ISSUE_TEMPLATE/
│       ├── feature_request.md
│       ├── bug_report.md
│       └── qa-review.md
│
├── skills/                              # Product development skills
│   ├── README.md
│   ├── ceo-review.md
│   ├── design-review.md
│   ├── qa-review.md
│   ├── product-manager-review.md
│   ├── technical-architecture-review.md
│   ├── security-review.md
│   ├── performance-review.md
│   ├── accessibility-review.md
│   ├── code-review.md
│   ├── devops-review.md
│   ├── compliance-review.md
│   └── run-review.sh
│
├── .env.example
├── .gitignore
├── .eslintrc.cjs
├── .prettierrc
├── package.json                         # Root: workspace config
└── README.md
```

---

## 3. Component Tree

```
<App>
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>          ← React Context for auth state
        <Header>
          <Logo />
          <UserMenu />
        </Header>

        <Routes>
          {/* Route 1: Homepage — Search + Generate */}
          <Route path="/" element={<HomePage />} />

          {/* Route 2: Playlist View — Player + Queue */}
          <Route path="/playlist/:id" element={<PlaylistPage />} />

          {/* Route 3: My Playlists — Saved grid (Auth) */}
          <Route path="/my-playlists" element={<MyPlaylistsPage />} />

          {/* Route 4: Shared Playlist — Public view */}
          <Route path="/p/:shareId" element={<SharedPlaylistPage />} />
        </Routes>

        <Footer />
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
</App>
```

### HomePage Component Tree

```
<HomePage>
  <SearchInput />              ← Text input with autofocus
  <FilterPanel>                ← Collapsible panel
    <DurationSlider />
    <VideoTypeCheckbox />
    <KeywordInput />           ← Include keywords
    <KeywordInput />           ← Exclude keywords
    <UploadDateSelect />
    <ViewCountInput />
    <MaxResultsSlider />
    <SafeSearchToggle />
    <div.actions>
      <Button "Apply" />
      <Button "Reset" />
    </div.actions>
  </FilterPanel>
  <Button "Generate" />
  <SearchSuggestions />        ← Example queries below search

  {/* After generation */}
  <LoadingSkeleton />          ← While fetching
  <ErrorState />               ← On error
  <EmptyState />               ← No results

  {/* Results shown → navigate to PlaylistPage */}
</HomePage>
```

### PlaylistPage Component Tree

```
<PlaylistPage>
  <PageHeader>
    <BackButton />
    <PlaylistTitle />
    <SaveButton />             ← Auth-gated
    <ShareButton />
    <RegenerateButton />
  </PageHeader>

  <div.player-layout>          ← Side-by-side on desktop, stacked on mobile
    <PlayerSection>
      <YouTubePlayer />        ← IFrame Player API
      <PlayerControls>
        <PreviousButton />
        <PlayPauseButton />
        <NextButton />
        <ShuffleToggle />
        <RepeatToggle />
      </PlayerControls>
      <ProgressBar />          ← Custom progress bar
      <VolumeControl />
    </PlayerSection>

    <QueueSection>
      <QueueHeader>
        <h2>"Up Next"</h2>
        <QueueControls />
      </QueueHeader>
      <QueueList>
        <QueueItem>             ← Draggable
          <DragHandle />
          <Thumbnail />
          <VideoInfo />
          <Duration />
        </QueueItem>
      </QueueList>
      <QueueEmptyState />       ← Empty queue
    </QueueSection>
  </div.player-layout>
</PlaylistPage>
```

### MyPlaylistsPage Component Tree

```
<MyPlaylistsPage>
  <PageHeader>
    <h1>"My Playlists"</h1>
  </PageHeader>

  <AuthGuard>                   ← Redirect to login if not authenticated
    <PlaylistGrid>
      <PlaylistCard />          ← Thumbnail collage, name, video count, date
      <PlaylistCard />
      ...
    </PlaylistGrid>
    <EmptyState />              ← No playlists yet
  </AuthGuard>
</MyPlaylistsPage>
```

---

## 4. Data Flow Architecture

### 4.1 Playlist Generation Flow

```
User                  Client (React)                   API Server              YouTube API
 │                        │                               │                       │
 │  Enter query +        │                               │                       │
 │  configure filters    │                               │                       │
 │──────────────────────►│                               │                       │
 │                        │                               │                       │
 │                        │  Validation:                  │                       │
 │                        │  - Query not empty            │                       │
 │                        │  - Filters in valid ranges    │                       │
 │                        │  - Check localStorage cache   │                       │
 │                        │                               │                       │
 │  Click "Generate"      │                               │                       │
 │──────────────────────►│                               │                       │
 │                        │  POST /api/v1/generate        │                       │
 │                        │  { query, filters }           │                       │
 │                        │──────────────────────────────►│                       │
 │                        │                               │                       │
 │                        │                               │  Rate limit check     │
 │                        │                               │  (10 req/min per IP)  │
 │                        │                               │                       │
 │                        │                               │  GET search.list       │
 │                        │                               │──────────────────────►│
 │                        │                               │                       │
 │                        │                               │  Return video IDs     │
 │                        │                               │◄──────────────────────│
 │                        │                               │                       │
 │                        │                               │  GET videos.list      │
 │                        │                               │  (for each batch)     │
 │                        │                               │──────────────────────►│
 │                        │                               │                       │
 │                        │                               │  Return full metadata │
 │                        │                               │◄──────────────────────│
 │                        │                               │                       │
 │                        │                               │  Apply server-side    │
 │                        │                               │  filters:             │
 │                        │                               │  - Duration filter    │
 │                        │                               │  - Video type filter  │
 │                        │                               │  - Keyword match      │
 │                        │                               │  - Keyword exclude    │
 │                        │                               │  - Upload date filter  │
 │                        │                               │  - Min views filter   │
 │                        │                               │  - Safe search flag   │
 │                        │                               │                       │
 │                        │                               │  Cache results        │
 │                        │                               │  (TTL: 5 min)         │
 │                        │                               │                       │
 │                        │  200 OK { videos,             │                       │
 │  Show loading          │    totalDuration,             │                       │
 │  skeleton              │    totalResults,              │                       │
 │◄───────────────────────│    cached }                   │                       │
 │                        │◄──────────────────────────────│                       │
 │                        │                               │                       │
 │  Render results        │                               │                       │
 │  → Navigate to         │                               │                       │
 │    PlaylistPage        │                               │                       │
 │                        │                               │                       │
 │  Store in Zustand:     │                               │                       │
 │  playlistStore +       │                               │                       │
 │  playerStore           │                               │                       │
 │                        │                               │                       │
 │  Update URL:           │                               │                       │
 │  /playlist/:sessionId  │                               │                       │
 │                        │                               │                       │
```

### 4.2 Player Playback Flow

```
User               Client (Browser)          YouTube IFrame Player        Zustand Store
 │                      │                            │                       │
 │  Click "Play"        │                            │                       │
 │─────────────────────►│                            │                       │
 │                      │                            │                       │
 │                      │  player.loadVideoById(id)   │                       │
 │                      │───────────────────────────►│                       │
 │                      │                            │                       │
 │                      │                            │  onReady fires         │
 │                      │                            │  → player.playVideo()  │
 │                      │                            │                       │
 │                      │  Update: isPlaying=true    │                       │
 │                      │          currentIndex=0     │──────────────────────►│
 │                      │                            │                       │
 │  See video playing   │                            │                       │
 │◄─────────────────────│                            │                       │
 │                      │                            │                       │
 │  Video ends          │                            │                       │
 │                      │                            │  onStateChange=ENDED  │
 │                      │◄───────────────────────────│                       │
 │                      │                            │                       │
 │                      │  Check: Is shuffle on?     │                       │
 │                      │    → Pick random next      │                       │
 │                      │  Check: Is repeat on?      │                       │
 │                      │    → Loop to start if last │                       │
 │                      │                            │                       │
 │                      │  Update: currentIndex++    │                       │
 │                      │───────────────────────────►│                       │
 │                      │                            │                       │
 │                      │  player.loadVideoById()    │                       │
 │                      │───────────────────────────►│                       │
 │                      │                            │                       │
 │  Auto-plays next     │                            │                       │
 │◄─────────────────────│                            │                       │
```

### 4.3 Auth Flow (Google OAuth PKCE)

```
User              Client (Browser)           API Server          Google OAuth
 │                     │                        │                    │
 │  Click "Sign In"    │                        │                    │
 │────────────────────►│                        │                    │
 │                     │                        │                    │
 │                     │  Generate code_verifier │                    │
 │                     │  + code_challenge (SHA256)                  │
 │                     │  Store verifier in sessionStorage          │
 │                     │                        │                    │
 │                     │  GET /api/v1/auth/google                    │
 │                     │───────────────────────►│                    │
 │                     │                        │                    │
 │                     │  Return { authUrl }    │                    │
 │                     │◄───────────────────────│                    │
 │                     │                        │                    │
 │                     │  Redirect to authUrl   │                    │
 │                     │────────────────────────────────────────────►│
 │                     │                        │                    │
 │  User signs in     │                        │                    │
 │◄────────────────────────────────────────────│                    │
 │                     │                        │                    │
 │  Redirect:          │                        │                    │
 │  /auth/callback?    │                        │                    │
 │  code=xxx&state=yyy │                        │                    │
 │                     │                        │                    │
 │                     │  POST /api/v1/auth/google/callback          │
 │                     │  { code, code_verifier } │                    │
 │                     │───────────────────────►│                    │
 │                     │                        │                    │
 │                     │                        │  Exchange code     │
 │                     │                        │  for tokens        │
 │                     │                        │───────────────────►│
 │                     │                        │                    │
 │                     │                        │  Return id_token   │
 │                     │                        │◄───────────────────│
 │                     │                        │                    │
 │                     │                        │  Verify id_token   │
 │                     │                        │  Find or create    │
 │                     │                        │  user in DB        │
 │                     │                        │  Generate JWT      │
 │                     │                        │                    │
 │                     │  200 { token, user }   │                    │
 │                     │◄───────────────────────│                    │
 │                     │                        │                    │
 │                     │  Set JWT in httpOnly    │                    │
 │                     │  cookie + update store  │                    │
 │  Signed in!         │                        │                    │
 │◄────────────────────│                        │                    │
```

---

## 5. State Management Design

### 5.1 Zustand Store Architecture

All state is managed through Zustand stores. Each store is independent and focused on one domain.

#### playerStore.ts

```typescript
interface PlayerState {
  // Player status
  isReady: boolean;
  isPlaying: boolean;
  currentIndex: number;
  currentTime: number;        // Updated every 250ms during playback
  duration: number;           // Current video duration
  volume: number;             // 0-100
  isMuted: boolean;

  // Queue state
  shuffleMode: boolean;
  repeatMode: boolean;        // 'none' | 'all' | 'one'
  originalQueue: Video[];     // Un-shuffled order (for repeat)
  shuffledQueue: Video[];     // Current shuffled order
  playbackHistory: number[];  // Stack of played indices (for Previous)

  // UI state
  isQueueExpanded: boolean;   // Mobile: bottom sheet toggle

  // Actions
  initPlayer: (videos: Video[]) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  reorderQueue: (from: number, to: number) => void;
  updateCurrentTime: (time: number) => void;
  skipUnavailable: (videoId: string) => void;
}
```

#### playlistStore.ts

```typescript
interface PlaylistState {
  // Current playlist
  currentPlaylist: Playlist | null;
  isGenerating: boolean;
  generationError: string | null;

  // Saved playlists (loaded from API)
  savedPlaylists: PlaylistSummary[];
  isLoadingSaved: boolean;

  // Guest mode (localStorage)
  guestPlaylists: LocalPlaylist[];
  maxGuestPlaylists: number;  // Default 10

  // Actions
  generatePlaylist: (query: string, filters: FilterState) => Promise<void>;
  savePlaylist: (name: string) => Promise<string>;  // Returns playlist ID
  loadSavedPlaylists: () => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  clearCurrentPlaylist: () => void;

  // Guest mode
  saveToLocalStorage: (playlist: LocalPlaylist) => void;
  loadFromLocalStorage: () => LocalPlaylist[];
  importToAccount: (playlistId: string) => Promise<void>;
}
```

#### filterStore.ts

```typescript
interface FilterState {
  // Filter values
  durationPreset: 'any' | 'under4' | '4to20' | 'over20' | 'custom';
  durationMin: number;        // Seconds
  durationMax: number;        // Seconds
  includeMusic: boolean;
  includeLive: boolean;
  includeShorts: boolean;
  includeStandard: boolean;
  includeKeywords: string[];
  excludeKeywords: string[];
  uploadDate: 'any' | 'last_week' | 'last_month' | 'last_year' | 'custom';
  uploadDateStart: string | null;
  uploadDateEnd: string | null;
  minViews: number;
  maxResults: number;
  safeSearch: boolean;

  // UI state
  isExpanded: boolean;

  // Actions
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  togglePanel: () => void;
  getActiveFilterCount: () => number;
  getFilterPayload: () => FilterPayload;  // Transforms to API format
}
```

#### authStore.ts

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: () => Promise<void>;           // Initiate Google OAuth
  handleCallback: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkSession: () => Promise<void>;   // On app load
}
```

### 5.2 State Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Zustand Stores                          │
│                                                               │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐     │
│  │  filterStore  │   │ playlistStore│   │  playerStore  │     │
│  │              │   │              │   │              │     │
│  │ - duration   │──►│ - generate() │──►│ - initPlayer │     │
│  │ - types      │   │ - save()     │   │ - play()     │     │
│  │ - keywords   │   │ - delete()   │   │ - next()     │     │
│  │ - dates      │   │              │   │ - shuffle()  │     │
│  │ - views      │   │              │   │ - repeat()   │     │
│  └──────────────┘   └──────┬───────┘   └──────┬───────┘     │
│                            │                   │              │
│                            ▼                   ▼              │
│                     ┌──────────────┐   ┌──────────────┐     │
│                     │   authStore  │   │  React Router│     │
│                     │              │   │              │     │
│                     │ - user       │   │ - navigate() │     │
│                     │ - token      │   │ - params     │     │
│                     │ - login/out  │   │              │     │
│                     └──────────────┘   └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 React Context Usage

React Context is used only for **cross-cutting concerns** that don't change frequently:

```typescript
// AuthContext — wraps the App to provide user state
// Zustand store is the source of truth; Context is for dependency injection
<AuthContext.Provider value={{ login, logout, user, isAuthenticated }}>
  <App />
</AuthContext.Provider>

// ToastContext — global toast notifications
<ToastContext.Provider value={{ showToast, hideToast }}>
  <App />
</ToastContext.Provider>
```

---

## 6. Filter Pipeline Architecture

### 6.1 Filter Processing Pipeline

The filter pipeline processes YouTube API results **server-side** after retrieval:

```
YouTube API Response
        │
        ▼
┌─────────────────────────────────────┐
│  Step 1: Raw Results                 │
│  - Parse search.list items           │
│  - Extract video IDs                 │
│  - Batch fetch videos.list metadata  │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Step 2: Duration Filter            │
│  - Parse ISO 8601 duration          │
│    (PT1H2M30S → 3750 seconds)       │
│  - Compare against min/max seconds  │
│  - Remove videos outside range      │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Step 3: Video Type Filter          │
│  - Check liveBroadcastContent       │
│  - Heuristic title/tags:            │
│    "music", "official" → Music      │
│    "live", "concert" → Live         │
│    "#shorts" → Shorts               │
│  - Remove unchecked types           │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Step 4: Keyword Include Filter     │
│  - Case-insensitive match           │
│  - Search title + tags + description│
│  - ALL include keywords must match  │
│    (AND logic)                      │
│  - Remove non-matching videos       │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Step 5: Keyword Exclude Filter     │
│  - Case-insensitive match           │
│  - Search title + tags + description│
│  - ANY exclude keyword removes video│
│    (OR logic)                       │
│  - Remove matching videos           │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Step 6: Upload Date Filter         │
│  - Parse publishedAt timestamp      │
│  - Compare against date range       │
│  - Remove videos outside range      │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Step 7: View Count Filter          │
│  - Parse statistics.viewCount       │
│  - Remove videos below threshold    │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Step 8: Max Results Truncation     │
│  - Sort by relevance (YouTube order)│
│  - Apply maxResults limit           │
│  - Return final array               │
└──────────────┬──────────────────────┘
               ▼
        Final Playlist Results
```

### 6.2 Filter Implementation (Server-Side)

```typescript
// server/src/services/filter.service.ts

interface FilterCriteria {
  durationMin?: number;           // Seconds
  durationMax?: number;           // Seconds
  videoTypes?: {                  // Which types to INCLUDE
    music: boolean;
    live: boolean;
    shorts: boolean;
    standard: boolean;
  };
  includeKeywords?: string[];
  excludeKeywords?: string[];
  uploadDateStart?: string;       // ISO date
  uploadDateEnd?: string;         // ISO date
  minViews?: number;
  maxResults: number;
}

interface FilteredVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;               // Seconds
  viewCount: number;
  publishedAt: string;            // ISO date
  tags: string[];
  description: string;
  liveBroadcastContent: string;
}

function applyFilters(videos: RawYouTubeVideo[], criteria: FilterCriteria): FilteredVideo[] {
  return videos
    .filter(byDuration(criteria.durationMin, criteria.durationMax))
    .filter(byVideoType(criteria.videoTypes))
    .filter(byIncludeKeywords(criteria.includeKeywords))
    .filter(byExcludeKeywords(criteria.excludeKeywords))
    .filter(byUploadDate(criteria.uploadDateStart, criteria.uploadDateEnd))
    .filter(byMinViews(criteria.minViews))
    .slice(0, criteria.maxResults);
}

// Each filter function follows the same pattern:
// (video: RawYouTubeVideo) => boolean (keep) or false (remove)

function byDuration(min?: number, max?: number) {
  return (video: RawYouTubeVideo): boolean => {
    const seconds = parseISO8601Duration(video.contentDetails.duration);
    if (min && seconds < min) return false;
    if (max && seconds > max) return false;
    return true;
  };
}

function byVideoType(types?: FilterCriteria['videoTypes']) {
  return (video: RawYouTubeVideo): boolean => {
    if (!types) return true;
    const videoType = classifyVideoType(video);
    return types[videoType] === true;
  };
}

function classifyVideoType(video: RawYouTubeVideo): 'music' | 'live' | 'shorts' | 'standard' {
  const titleLower = video.snippet.title.toLowerCase();
  const tags = (video.snippet.tags || []).map(t => t.toLowerCase());
  const descLower = (video.snippet.description || '').toLowerCase();

  if (video.snippet.liveBroadcastContent === 'live' || video.snippet.liveBroadcastContent === 'upcoming') {
    return 'live';
  }
  if (titleLower.includes('#shorts') || tags.includes('#shorts')) {
    return 'shorts';
  }
  const musicSignals = ['music', 'lyric', 'official audio', 'official video', 'song'];
  if (musicSignals.some(s => titleLower.includes(s)) || tags.some(t => musicSignals.some(m => t.includes(m)))) {
    return 'music';
  }
  return 'standard';
}
```

### 6.3 Video Type Classification Logic

| Signal | Classification |
|--------|---------------|
| `liveBroadcastContent = 'live' \| 'upcoming'` | Live |
| Title/tags contain `#shorts` | Shorts |
| Title contains `music`, `lyric`, `official audio`, `official video`, `song` | Music |
| Tags contain music-related terms | Music |
| None of the above | Standard |

---

## 7. YouTube Player Integration

### 7.1 IFrame Player API Architecture

```
┌───────────────────────────────────────────────────────┐
│            YouTubePlayer.tsx Component                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  <div ref={containerRef}>                        │   │
│  │    <div id="youtube-player" />  ← IFrame injected│   │
│  │  </div>                                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Lifecycle:                                             │
│  1. Mount → Load YouTube IFrame API script              │
│  2. onReady → Store player ref, set isReady=true        │
│  3. onStateChange → Update playerStore                  │
│  4. onError → Handle error (skip/retry)                │
│  5. Unmount → Cleanup (remove listeners, destroy)       │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Player Lifecycle Hook

```typescript
// client/src/hooks/useYouTubePlayer.ts

function useYouTubePlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load YouTube IFrame API script if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.id = 'youtube-iframe-api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);

      // Wait for API to be ready
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    return () => {
      // Cleanup
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  function initPlayer() {
    if (!containerRef.current) return;

    playerRef.current = new YT.Player('youtube-player', {
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 0,
        controls: 1,
        disablekb: 0,
        enablejsapi: 1,
        fs: 0,                    // No fullscreen button
        modestbranding: 1,
        rel: 0,                   // Don't show related videos
        iv_load_policy: 3,        // No video annotations
        origin: window.location.origin,
      },
      events: {
        onReady: (event) => {
          playerRef.current = event.target;
          setIsReady(true);
          // Re-apply current volume/mute state from store
        },
        onStateChange: (event) => {
          handleStateChange(event.data);
        },
        onError: (event) => {
          handlePlayerError(event.data);
        },
      },
    });
  }

  function handleStateChange(state: number) {
    switch (state) {
      case YT.PlayerState.PLAYING:
        playerStore.getState().setPlaying(true);
        break;
      case YT.PlayerState.PAUSED:
        playerStore.getState().setPlaying(false);
        break;
      case YT.PlayerState.ENDED:
        playerStore.getState().next();  // Auto-advance
        break;
      case YT.PlayerState.CUED:
        // Video loaded, ready to play
        break;
    }
  }

  function handlePlayerError(errorCode: number) {
    switch (errorCode) {
      case 2:       // Invalid parameter
      case 5:       // HTML5 player error
      case 100:     // Video not found (deleted/private)
      case 101:     // Embedding not allowed
      case 150:     // Embedding not allowed
        toast.show(`Skipping unavailable video`);
        playerStore.getState().skipUnavailable(
          playerStore.getState().currentVideoId
        );
        playerStore.getState().next();
        break;
      case 150:
        toast.error('This video cannot be embedded');
        playerStore.getState().next();
        break;
    }
  }

  return { containerRef, playerRef, isReady };
}
```

### 7.3 Player Controls Mapping

```
Button      →  YouTube API Call             →  Store Update
──────────────────────────────────────────────────────────────────
Play        →  player.playVideo()           →  isPlaying = true
Pause       →  player.pauseVideo()          →  isPlaying = false
Skip        →  player.loadVideoById(next)   →  currentIndex++
Previous    →  player.loadVideoById(prev)   →  currentIndex--
Shuffle On  →  Fisher-Yates shuffle queue   →  shuffledQueue = [...]
Repeat      →  (handled in next() logic)    →  repeatMode = toggle
Seek Bar    →  player.seekTo(seconds, true) →  currentTime = seconds
Volume      →  player.setVolume(vol)        →  volume = vol
Mute        →  player.mute()                →  isMuted = true
Unmute      →  player.unMute()              →  isMuted = false
```

---

## 8. Authentication Flow

### 8.1 OAuth PKCE Flow (Detailed)

```
Step 1: Client generates PKCE challenge
  ┌───────────────────────────────────────┐
  │ code_verifier = randomBytes(32)       │
  │   → base64url-encoded                 │
  │ code_challenge = SHA256(verifier)     │
  │   → base64url-encoded                 │
  │ Store: sessionStorage['pkce_verifier'] │
  └───────────────────────────────────────┘

Step 2: Redirect to Google
  GET https://accounts.google.com/o/oauth2/v2/auth
    ?client_id={GOOGLE_CLIENT_ID}
    &redirect_uri={CALLBACK_URL}
    &response_type=code
    &scope=profile+email
    &code_challenge={code_challenge}
    &code_challenge_method=S256
    &state={csrf_token}

Step 3: Google redirects to callback
  GET /auth/callback?code={auth_code}&state={csrf_token}

Step 4: Server exchanges code for tokens
  POST https://oauth2.googleapis.com/token
    code={auth_code}
    client_id={GOOGLE_CLIENT_ID}
    client_secret={GOOGLE_CLIENT_SECRET}
    redirect_uri={CALLBACK_URL}
    grant_type=authorization_code
    code_verifier={from sessionStorage}

Step 5: Server verifies id_token
  - Verify JWT signature using Google's public keys
  - Extract: sub (Google ID), email, name, picture
  - Find or create user in database
  - Generate internal JWT

Step 6: Response
  Set-Cookie: session=jwt_token; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
  Redirect to / (or original page)
```

### 8.2 JWT Token Structure

```typescript
interface AccessTokenPayload {
  sub: string;            // User UUID
  email: string;
  name: string;
  iat: number;            // Issued at
  exp: number;            // Expires (15 min)
}

interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;   // For revoking all sessions
  iat: number;
  exp: number;            // Expires (7 days)
}
```

### 8.3 Auth Middleware

```typescript
// server/src/middleware/auth.middleware.ts

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.session || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Optional auth middleware (doesn't reject, just sets user if present)
function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.session;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
      req.user = { id: payload.sub, email: payload.email, name: payload.name };
    } catch {
      // Silent fail — user stays unauthenticated
    }
  }
  next();
}
```

---

## 9. API Layer Design

### 9.1 Complete API Specification

#### POST /api/v1/generate

**Purpose**: Generate a playlist from search query + filters.

**Rate Limit**: 10 requests/min per IP | 50 requests/min per authenticated user

**Request**:
```json
{
  "query": "string (1-200 chars, required)",
  "filters": {
    "durationMin": "number (seconds, optional)",
    "durationMax": "number (seconds, optional)",
    "videoTypes": {
      "music": "boolean (default: true)",
      "live": "boolean (default: true)",
      "shorts": "boolean (default: true)",
      "standard": "boolean (default: true)"
    },
    "includeKeywords": ["string[] (optional)"],
    "excludeKeywords": ["string[] (optional)"],
    "uploadDateStart": "ISO date string (optional)",
    "uploadDateEnd": "ISO date string (optional)",
    "minViews": "number (optional)",
    "maxResults": "number (10-50, default: 25)",
    "safeSearch": "boolean (default: true)"
  }
}
```

**Response (200)**:
```json
{
  "videos": [
    {
      "id": "string",
      "title": "string",
      "channel": "string",
      "channelId": "string",
      "thumbnail": "string (URL)",
      "duration": "number (seconds)",
      "viewCount": "number",
      "publishedAt": "string (ISO date)"
    }
  ],
  "totalDuration": "number (seconds, sum of all video durations)",
  "totalResults": "number",
  "cached": "boolean"
}
```

**Error Responses**:
```json
// 400 - Validation error
{ "error": "Validation failed", "details": [{ "field": "query", "message": "Query is required" }] }

// 429 - Rate limited
{ "error": "Too many requests", "retryAfter": 60, "code": "RATE_LIMITED" }

// 502 - YouTube API error
{ "error": "YouTube service error", "code": "YOUTUBE_ERROR" }

// 503 - Quota exhausted
{ "error": "Service temporarily unavailable", "retryAfter": 3600, "code": "QUOTA_EXHAUSTED" }
```

#### POST /api/v1/auth/google

**Purpose**: Initiate Google OAuth flow.

**Response (200)**:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Rate Limit**: 5 requests/min per IP

#### POST /api/v1/auth/google/callback

**Purpose**: Complete OAuth callback.

**Request**:
```json
{
  "code": "string (authorization code)",
  "codeVerifier": "string (PKCE verifier)"
}
```

**Response (200)**:
```json
{
  "token": "string (JWT)",
  "user": {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "avatarUrl": "string (URL)"
  }
}
```

#### POST /api/v1/auth/refresh

**Purpose**: Refresh expired JWT.

**Cookie**: Contains refresh token.

**Response (200)**:
```json
{
  "token": "string (new JWT)"
}
```

#### POST /api/v1/playlists

**Purpose**: Save a playlist (auth required).

**Request**:
```json
{
  "name": "string (1-100 chars, required)",
  "query": "string (required)",
  "filters": "object",
  "videos": [
    {
      "youtubeId": "string (required)",
      "title": "string (required)",
      "channel": "string (required)",
      "channelId": "string (optional)",
      "thumbnail": "string (URL, optional)",
      "duration": "number (seconds, optional)",
      "position": "number (required)"
    }
  ]
}
```

**Response (201)**:
```json
{
  "id": "uuid",
  "shareUrl": "https://yousite.com/p/{uuid}"
}
```

#### GET /api/v1/playlists/user

**Purpose**: List user's saved playlists (auth required).

**Response (200)**:
```json
{
  "playlists": [
    {
      "id": "uuid",
      "name": "string",
      "query": "string",
      "videoCount": "number",
      "totalDuration": "number",
      "createdAt": "ISO date"
    }
  ]
}
```

#### GET /api/v1/playlists/:id

**Purpose**: Get a saved playlist (public read access).

**Response (200)**:
```json
{
  "id": "uuid",
  "name": "string",
  "query": "string",
  "filters": "object",
  "videos": [
    {
      "youtubeId": "string",
      "title": "string",
      "channel": "string",
      "thumbnail": "string (URL)",
      "duration": "number",
      "viewCount": "number",
      "position": "number"
    }
  ],
  "totalDuration": "number",
  "user": { "name": "string" },
  "createdAt": "ISO date",
  "ogImage": "string (URL for social sharing)"
}
```

#### DELETE /api/v1/playlists/:id

**Purpose**: Delete a playlist (auth required, must own).

**Response (204)**: No content.

#### POST /api/v1/sentry/tunnel

**Purpose**: Tunnel for Sentry error reporting when CSP blocks direct reporting. Forward captured error payloads to Sentry server-side.

**Rate Limit**: 30 requests/min per IP

**Request**: Raw Sentry envelope (forward from Sentry SDK client)

**Response (200)**: Forwarded to Sentry server endpoint.

---

### 9.2 API Client (Frontend)

```typescript
// client/src/api/client.ts

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: { auth?: boolean }
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options?.auth) {
      const token = authStore.getState().token;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',  // For httpOnly cookies
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      
      if (response.status === 401 && error.code === 'TOKEN_EXPIRED') {
        // Attempt token refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.request<T>(method, path, body, options);
        }
      }

      throw new ApiError(response.status, error);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async refreshToken(): Promise<boolean> {
    try {
      const { token } = await this.request<{ token: string }>('POST', '/auth/refresh');
      authStore.getState().setToken(token);
      return true;
    } catch {
      authStore.getState().logout();
      return false;
    }
  }

  get<T>(path: string, options?: { auth?: boolean }) {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: { auth?: boolean }) {
    return this.request<T>('POST', path, body, options);
  }

  delete<T>(path: string, options?: { auth?: boolean }) {
    return this.request<T>('DELETE', path, undefined, options);
  }
}

export const api = new ApiClient(BASE_URL);
```

---

## 10. Database Schema & Migrations

### 10.1 Prisma Schema

```prisma
// server/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique
  name      String
  googleId  String   @unique @map("google_id")
  avatarUrl String?  @map("avatar_url")

  playlists Playlist[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Playlist {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String   @db.VarChar(255)
  query     String   @db.VarChar(500)
  filters   Json     @default("{}")

  videos    PlaylistVideo[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([userId])
  @@map("playlists")
}

model PlaylistVideo {
  id              String   @id @default(uuid()) @db.Uuid
  playlistId      String   @map("playlist_id") @db.Uuid
  playlist        Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  youtubeId       String   @map("youtube_id") @db.VarChar(50)
  title           String   @db.VarChar(500)
  channel         String   @db.VarChar(255)
  channelId       String?  @map("channel_id") @db.VarChar(100)
  thumbnail       String?  @db.VarChar(500)
  durationSeconds Int?     @map("duration_seconds")
  viewCount       BigInt?  @map("view_count")
  position        Int

  createdAt DateTime @default(now()) @map("created_at")

  @@index([playlistId])
  @@index([playlistId, position])
  @@map("playlist_videos")
}
```

### 10.2 Migration Strategy

```bash
# Initial migration (M0)
npx prisma migrate dev --name init

# Future migrations (example)
npx prisma migrate dev --name add-share-count
npx prisma migrate dev --name add-playlist-tags

# Production
npx prisma migrate deploy
```

### 10.3 Index Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| `users` | `google_id` (unique) | Fast OAuth lookup |
| `playlists` | `user_id` | List all playlists for a user |
| `playlist_videos` | `playlist_id` | Get all videos for a playlist |
| `playlist_videos` | `(playlist_id, position)` | Ordered retrieval of videos |

---

## 11. Caching Strategy

### 11.1 Multi-Layer Caching

```
┌────────────────────────────────────────────────────────────┐
│                    Caching Layers                             │
│                                                              │
│  1. Client Cache (localStorage / Service Worker)             │
│     TTL: 5 minutes                                           │
│     Key: `yspc_cache_{query_hash}`                           │
│     Value: Generated playlist                                │
│     Invalidation: On explicit "Regenerate" action            │
│                                                              │
│  2. Server Cache (In-memory LRU)                             │
│     TTL: 5 minutes                                           │
│     Max Size: 100 entries                                    │
│     Key: `{query}_{filters_hash}`                            │
│     Value: Filtered playlist                                 │
│     Invalidation: TTL expiry                                 │
│                                                              │
│  3. YouTube API Response Cache                                │
│     TTL: 30 minutes                                          │
│     Key: `yt_search_{query}` (raw search.list response)      │
│     Value: Raw API response (JSON)                           │
│     Invalidation: TTL expiry                                 │
│     Purpose: Avoid hitting YouTube quota for repeated queries │
└────────────────────────────────────────────────────────────┘
```

### 11.2 Client-Side Caching

```typescript
// client/src/utils/cache.ts

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;  // Milliseconds
}

const CACHE_PREFIX = 'yspc_cache_';
const DEFAULT_TTL = 5 * 60 * 1000;  // 5 minutes

function getCacheKey(query: string, filters: FilterPayload): string {
  const hash = simpleHash(`${query}_${JSON.stringify(filters)}`);
  return `${CACHE_PREFIX}${hash}`;
}

function getFromCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data as T;
  } catch {
    return null;  // Corrupted cache, silently ignore
  }
}

function setToCache(key: string, data: unknown, ttl = DEFAULT_TTL): void {
  try {
    const entry: CacheEntry = { data, timestamp: Date.now(), ttl };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full — clear oldest entries
    cleanOldestCacheEntries();
  }
}
```

### 11.3 Server-Side Caching

```typescript
// server/src/utils/cache.ts

import { LRUCache } from 'lru-cache';

const searchCache = new LRUCache<string, SearchResult>({
  max: 100,                                   // Max 100 entries
  ttl: 1000 * 60 * 5,                         // 5 minute TTL
});

const apiResponseCache = new LRUCache<string, RawYouTubeResponse>({
  max: 500,                                   // Max 500 entries
  ttl: 1000 * 60 * 30,                        // 30 minute TTL
});

function generateCacheKey(query: string, filters: FilterCriteria): string {
  const filterHash = createHash('sha256')
    .update(JSON.stringify(filters))
    .digest('hex')
    .slice(0, 16);
  return `${query.toLowerCase().trim()}_${filterHash}`;
}
```

---

## 12. Error Handling Strategy

### 12.1 Error Classification

```
┌──────────────────────────────────────────────────────────────────┐
│                     Error Classification                           │
│                                                                    │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐   │
│  │  Recoverable Errors      │  │  Non-Recoverable Errors       │   │
│  │                         │  │                              │   │
│  │  - Rate limited (429)   │  │  - Invalid API key            │   │
│  │  - Quota exhausted (503)│  │  - YouTube API deprecation    │   │
│  │  - Token expired (401)  │  │  - Database connection lost   │   │
│  │  - Network timeout      │  │  - Server crash               │   │
│  │  - Video unavailable    │  │                              │   │
│  └─────────────────────────┘  └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 12.2 Error Response Format (Server)

```typescript
// server/src/utils/errors.ts

class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: Record<string, unknown>,
    public retryAfter?: number
  ) {
    super(message);
  }

  static badRequest(message: string, details?: Record<string, unknown>) {
    return new AppError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(401, message, 'UNAUTHORIZED');
  }

  static rateLimited(retryAfter = 60) {
    return new AppError(429, 'Too many requests', 'RATE_LIMITED', undefined, retryAfter);
  }

  static quotaExhausted(retryAfter = 3600) {
    return new AppError(503, 'Service temporarily unavailable', 'QUOTA_EXHAUSTED', undefined, retryAfter);
  }

  static youTubeError(message = 'YouTube service error') {
    return new AppError(502, message, 'YOUTUBE_ERROR');
  }
}

// Global error handler middleware
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
      retryAfter: err.retryAfter,
    });
    return;
  }

  // Unexpected error
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  });
}
```

### 12.3 Client-Side Error Handling

```typescript
// client/src/components/feedback/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('React error boundary caught', { error, componentStack: info.componentStack });
    Sentry.captureException(error);  // If Sentry is integrated
  }

  render() {
    if (this.state.hasError) {
      return <ErrorState onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

// API error handling in hooks
function usePlaylistGenerator() {
  const { generatePlaylist, isGenerating, error } = playlistStore();

  const generate = useCallback(async (query: string, filters: FilterState) => {
    try {
      await generatePlaylist(query, filters);
      navigate(`/playlist/${sessionId}`);
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case 'QUOTA_EXHAUSTED':
            showToast({
              type: 'error',
              message: 'We are getting too popular! Try again later.',
              duration: 0,  // Persistent until dismissed
            });
            break;
          case 'RATE_LIMITED':
            showToast({
              type: 'warning',
              message: `Too many requests. Try again in ${err.retryAfter} seconds.`,
            });
            break;
          case 'YOUTUBE_ERROR':
            showToast({
              type: 'error',
              message: 'YouTube is having issues. Please try again.',
            });
            break;
          default:
            showToast({
              type: 'error',
              message: 'Something went wrong. Please try again.',
            });
        }
      }
    }
  }, []);

  return { generate, isGenerating, error };
}
```

### 12.4 Toast Notification System

```typescript
// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;     // 0 = persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

---

## 13. Testing Strategy

### 13.1 Test Pyramid

```
         ╱╲
        ╱  ╲          E2E Tests (Cypress)
       ╱    ╲         3-5 critical user flows
      ╱──────╲
     ╱        ╲       Integration Tests (Supertest + Vitest)
    ╱          ╲      API endpoints, database interactions
   ╱────────────╲
  ╱              ╲   Unit Tests (Vitest)
 ╱                ╲  Filter pipeline, utility functions, stores
╱──────────────────╲
```

### 13.2 Unit Tests

```typescript
// server/tests/unit/filter.service.test.ts

describe('Filter Service', () => {
  describe('byDuration()', () => {
    it('keeps videos within duration range', () => {
      const video = createMockVideo({ duration: 'PT5M' });
      expect(applyFilters([video], { durationMin: 120, durationMax: 600 }))
        .toHaveLength(1);
    });

    it('removes videos shorter than minimum', () => {
      const video = createMockVideo({ duration: 'PT1M' });
      expect(applyFilters([video], { durationMin: 120 }))
        .toHaveLength(0);
    });

    it('removes videos longer than maximum', () => {
      const video = createMockVideo({ duration: 'PT15M' });
      expect(applyFilters([video], { durationMax: 600 }))
        .toHaveLength(0);
    });

    it('handles zero duration (live stream)', () => {
      const video = createMockVideo({ duration: 'PT0S' });
      expect(applyFilters([video], { durationMin: 60 }))
        .toHaveLength(0);
    });
  });

  describe('classifyVideoType()', () => {
    it('classifies "live" based on liveBroadcastContent', () => {
      const video = createMockVideo({ liveBroadcastContent: 'live' });
      expect(classifyVideoType(video)).toBe('live');
    });

    it('classifies "shorts" based on title with #shorts', () => {
      const video = createMockVideo({ title: 'Best moments #shorts' });
      expect(classifyVideoType(video)).toBe('shorts');
    });

    it('classifies "music" based on title containing "official audio"', () => {
      const video = createMockVideo({ title: 'Song Name (Official Audio)' });
      expect(classifyVideoType(video)).toBe('music');
    });

    it('defaults to "standard" for generic content', () => {
      const video = createMockVideo({ title: 'How to Cook Pasta' });
      expect(classifyVideoType(video)).toBe('standard');
    });
  });

  describe('full filter pipeline', () => {
    it('applies all filters in order', () => {
      const videos = [
        createMockVideo({ duration: 'PT5M', title: 'Song (Official Audio)', viewCount: 500000 }),
        createMockVideo({ duration: 'PT30M', title: 'Lecture', viewCount: 10000 }),
        createMockVideo({ duration: 'PT2M', title: '#shorts reaction', viewCount: 1000000 }),
      ];

      const result = applyFilters(videos, {
        durationMin: 120,
        durationMax: 1800,
        videoTypes: { music: false, live: false, shorts: false, standard: true },
        minViews: 5000,
        maxResults: 25,
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Lecture');
    });
  });
});
```

### 13.3 Integration Tests

```typescript
// server/tests/integration/generate.test.ts

describe('POST /api/v1/generate', () => {
  it('returns 200 with valid query and filters', async () => {
    const res = await request(app)
      .post('/api/v1/generate')
      .send({
        query: 'lofi beats',
        filters: { maxResults: 5, safeSearch: true },
      });

    expect(res.status).toBe(200);
    expect(res.body.videos).toBeDefined();
    expect(res.body.videos.length).toBeLessThanOrEqual(5);
    expect(res.body.totalDuration).toBeGreaterThan(0);
    expect(res.body.cached).toBe(false);
  });

  it('returns 400 for empty query', async () => {
    const res = await request(app)
      .post('/api/v1/generate')
      .send({ query: '', filters: {} });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('returns 429 when rate limit exceeded', async () => {
    const promises = Array(15).fill(null).map(() =>
      request(app).post('/api/v1/generate').send({ query: 'test', filters: {} })
    );

    const results = await Promise.all(promises);
    const tooMany = results.some(r => r.status === 429);
    expect(tooMany).toBe(true);
  });
});
```

---

## 14. Deployment Architecture

### 14.1 Environment Configuration

```yaml
# .env.example (root)

# Client
VITE_API_URL=http://localhost:3001/api/v1

# Server
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/yspc
YOUTUBE_API_KEY=your_youtube_api_key
JWT_SECRET=your_jwt_secret_32_chars_min
JWT_REFRESH_SECRET=your_refresh_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CORS_ORIGIN=http://localhost:5173
SENTRY_DSN=your_sentry_dsn
```

### 14.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml

name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npm run lint          # ESLint
      - run: npm run typecheck     # tsc --noEmit
      - run: npm run test          # vitest
      - run: npm run build         # vite build

  deploy-client:
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-server:
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: railway/railway-action@v2
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: api-server
```

### 14.3 Production Architecture

```
                         User
                          │
                          ▼
                    ┌──────────┐
                    │ Cloudflare│
                    │ DNS + CDN │
                    └────┬─────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
       ┌─────────────┐     ┌─────────────┐
       │  Vercel      │     │  Railway     │
       │  (Frontend)  │     │  (Backend)   │
       │  Static SPA  │     │  Node.js API │
       │              │     │  + Postgres  │
       └─────────────┘     └─────────────┘
                                    │
                                    ▼
                           ┌────────────────┐
                           │  YouTube Data   │
                           │  API v3         │
                           └────────────────┘
```

### 14.4 Monitoring Stack

| Tool | Purpose | Free Tier Limits |
|------|---------|-----------------|
| **Sentry** | Error tracking (frontend + backend) | 5k events/month |
| **Better Uptime** | Uptime monitoring | 1 monitor, 5-min checks |
| **PostHog** | Product analytics | 1M events/month (self-hosted free) |
| **Railway Dashboard** | Server metrics (CPU, RAM, logs) | Included |
| **Google Cloud Console** | YouTube API usage dashboard | Included |

---

## 15. Implementation Order (Build Sequence)

### Phase M0: Foundation (Week 1)

| Day | Task | Output | Dependencies |
|-----|------|--------|-------------|
| **Day 1** | Initialize monorepo with npm workspaces | `package.json`, TypeScript config, ESLint, Prettier | None |
| **Day 1** | Set up Vite + React + Tailwind + TypeScript | Client skeleton builds | Monorepo setup |
| **Day 1** | Set up Express + Prisma + TypeScript | Server skeleton builds | Monorepo setup |
| **Day 2** | Create Prisma schema + run initial migration | `schema.prisma`, migration files | Server setup |
| **Day 2** | Set up GitHub CI/CD pipeline | `.github/workflows/ci.yml` | Repo setup |
| **Day 2** | Deploy to Vercel (frontend) + Railway (backend) | Staging environment running | CI/CD setup |
| **Day 3** | Create shared types between client and server | `types/` package | Monorepo setup |
| **Day 3** | Set up API client wrapper on frontend | `api/client.ts` | Server setup |
| **Day 3** | Set up global error handler + API response types | `errorHandler.ts`, error types | Server setup |
| **Day 4** | Set up Zustand stores (empty shells) | All 4 store files | Client setup |
| **Day 4** | Set up routing (React Router) | Route structure | Client setup |
| **Day 4** | Create UI primitive components (Button, Input, Select, etc.) | `components/ui/` | Client setup |
| **Day 5** | Create layout components (Header, Footer, PageShell) | Layout structure | UI components |
| **Day 5** | Set up Docker Compose for local Postgres | `docker-compose.yml` | Database |

### Phase M1: Core Generation (Week 2-3)

| Day | Task | Output | Dependencies |
|-----|------|--------|-------------|
| **Day 6** | Implement YouTube API client service | `youtube.service.ts` | Server setup |
| **Day 6** | Implement filter service (duration, keywords) | `filter.service.ts` | YouTube service |
| **Day 7** | Implement `/api/v1/generate` endpoint + validation | `generate.controller.ts`, `generate.routes.ts` | YouTube service + filter service |
| **Day 7** | Implement rate limiting middleware | `rateLimiter.ts` | Server setup |
| **Day 8** | Build SearchInput + Generate button | `SearchInput.tsx` | UI components |
| **Day 8** | Build FilterPanel skeleton (collapsible) + DurationSlider | `FilterPanel.tsx`, `DurationSlider.tsx` | UI components |
| **Day 9** | Build filterStore + api integration | `filterStore.ts` + `api/generate.ts` | Zustand + API client |
| **Day 9** | Build playlistStore (generate action) | `playlistStore.ts` | API client |
| **Day 10** | Build HomePage with search + generate flow | `HomePage.tsx` | Search input, filter panel, stores |
| **Day 10** | Build LoadingSkeleton + EmptyState + ErrorState | Feedback components | UI components |
| **Day 11** | Implement YouTubePlayer hook + component | `useYouTubePlayer.ts`, `YouTubePlayer.tsx` | Player API |
| **Day 11** | Build PlaylistPage (basic layout) | `PlaylistPage.tsx` | Player component |
| **Day 12** | Implement basic player controls (play/pause/skip) | `PlayerControls.tsx` | Player component |
| **Day 12** | Implement auto-advance (onStateChange → next) | Update playerStore + YouTubePlayer | Player controls |
| **Day 13** | Integration test: generate → play → auto-advance | Tests pass | All M1 features |
| **Day 13** | Deploy M1 to staging | Staging with working gen + player | All M1 features |

### Phase M2: Filters & Queue (Week 3-4)

| Day | Task | Output | Dependencies |
|-----|------|--------|-------------|
| **Day 14** | Build remaining filter components (VideoType, Keywords, Date, Views, SafeSearch) | All filter UI components | Filter panel |
| **Day 14** | Extend filter pipeline with remaining filters | Update `filter.service.ts` | Filter service |
| **Day 15** | Build queue components (QueueList, QueueItem) | Queue components | Player page layout |
| **Day 15** | Implement drag-and-drop reorder | `useDragAndDrop.ts` | Queue components |
| **Day 16** | Implement Shuffle (Fisher-Yates) | Update playerStore | Queue components |
| **Day 16** | Implement Repeat (loop queue) | Update playerStore | Player controls |
| **Day 17** | Build ProgressBar component | `ProgressBar.tsx` | Player component |
| **Day 17** | Build VolumeControl component | `VolumeControl.tsx` | Player component |
| **Day 18** | Build Previous button + playback history | Update playerStore | Player controls |
| **Day 18** | Integration test: full filter pipeline + queue operations | Tests pass | All M2 features |
| **Day 19** | Deploy M2 to staging | Staging with full filters + queue | All M2 features |

### Phase M3: Accounts (Week 4-5)

| Day | Task | Output | Dependencies |
|-----|------|--------|-------------|
| **Day 20** | Implement Google OAuth PKCE flow on server | `auth.service.ts`, `auth.controller.ts` | Server setup |
| **Day 20** | Implement auth middleware (JWT verify) | `auth.middleware.ts` | Auth service |
| **Day 21** | Build GoogleSignInButton + AuthModal | Auth components | UI components |
| **Day 21** | Build auth store + auth API calls | `authStore.ts`, `api/auth.ts` | Auth components |
| **Day 22** | Implement playlist CRUD endpoints (server) | `playlists.controller.ts` | Auth middleware |
| **Day 22** | Build Save button + Save playlist flow | `SaveButton.tsx` + playlistStore update | Auth + API |
| **Day 23** | Build MyPlaylistsPage with PlaylistGrid + PlaylistCard | `MyPlaylistsPage.tsx` | Playlist CRUD |
| **Day 23** | Build ShareButton + share link creation | `ShareButton.tsx` | Playlist CRUD |
| **Day 24** | Build SharedPlaylistPage (public view) | `SharedPlaylistPage.tsx` | Playlist CRUD |
| **Day 24** | Implement guest mode (localStorage) | `useLocalStorage.ts` + playlistStore | All stores |
| **Day 25** | Implement "Import from Guest Mode" flow | Update playlistStore | Guest mode + Auth |
| **Day 25** | Integration test: auth → save → load → share | Tests pass | All M3 features |
| **Day 26** | Deploy M3 to staging | Staging with accounts | All M3 features |

### Phase M4: Polish (Week 5-6)

| Day | Task | Output | Dependencies |
|-----|------|--------|-------------|
| **Day 27** | Implement server-side caching (LRU) | `server/src/utils/cache.ts` | Server setup |
| **Day 27** | Implement client-side caching (localStorage) | `client/src/utils/cache.ts` | API client |
| **Day 28** | Build all error states + empty states (screen-level) | ErrorState, EmptyState variations | All pages |
| **Day 28** | Implement mobile responsive layout | CSS media queries, breakpoint handling | All pages |
| **Day 29** | Implement WCAG accessibility requirements | Keyboard nav, ARIA labels, focus rings, skip link | All pages |
| **Day 29** | Implement reduced motion support | Tailwind `motion-reduce` variants + CSS | All pages |
| **Day 30** | Set up Sentry error tracking (client + server) | Sentry configuration | All features |
| **Day 30** | Performance optimization: bundle analysis, lazy loading | Code splitting, React.lazy + Suspense | All pages |
| **Day 31** | Lighthouse audit + fix issues | Score targets met | All pages |
| **Day 31** | Final E2E tests (Cypress: 5 critical flows) | Tests pass | All features |
| **Day 32** | Production deployment | Production live | All features |
| **Day 32** | Monitoring dashboards + alerting configured | Sentry + Better Uptime + PostHog | Production |

### Build Order Dependency Graph

```
M0: Foundation (Week 1)
  ├── M0.1: Monorepo + Tooling (Day 1-2)
  ├── M0.2: CI/CD + Deploy (Day 2-3)
  ├── M0.3: Shared Types + API Client (Day 3-4)
  └── M0.4: UI Kit + Layout (Day 4-5)
       │
       ▼
M1: Core Generation (Week 2-3)
  ├── M1.1: YouTube API Proxy + Filter Pipeline (Day 6-7)
  ├── M1.2: Search UI + Filter Panel (Day 8-10)
  ├── M1.3: YouTube Player + Controls (Day 11-12)
  └── M1.4: Integration + Deploy (Day 13)
       │
       ▼
M2: Filters & Queue (Week 3-4)
  ├── M2.1: Full Filter UI + Server-side Pipeline (Day 14-15)
  ├── M2.2: Queue + Drag-Drop (Day 15-16)
  ├── M2.3: Shuffle + Repeat + Progress (Day 16-17)
  └── M2.4: Integration + Deploy (Day 18-19)
       │
       ▼
M3: Accounts (Week 4-5)
  ├── M3.1: OAuth + JWT (Day 20-21)
  ├── M3.2: Playlist CRUD + Save/Share (Day 22-23)
  ├── M3.3: Guest Mode + Import (Day 24-25)
  └── M3.4: Integration + Deploy (Day 26)
       │
       ▼
M4: Polish (Week 5-6)
  ├── M4.1: Caching (Client + Server) (Day 27-28)
  ├── M4.2: Error States + Responsive (Day 28-29)
  ├── M4.3: Accessibility + Performance (Day 29-30)
  └── M4.4: E2E Tests + Production Launch (Day 31-32)
```

---

## Appendix A: YouTube Data API v3 Quota Management

### Cost Per Operation

| Operation | API Call | Unit Cost |
|-----------|----------|-----------|
| Search videos | `search.list` | 100 units |
| Get video details | `videos.list` (1 video) | 1 unit |
| Get video details | `videos.list` (50 videos) | 1 unit (batch) |
| Get channel details | `channels.list` | 1 unit |
| **Total per generation** | Search (100) + Videos (1) | **~101 units** |

### Quota Budgeting

- **Free daily quota**: 10,000 units
- **Per generation cost**: ~125 units (search + videos + safety margin)
- **Max generations per day**: ~80 (10,000 / 125)
- **With caching (50% hit rate)**: ~160 generations per day visible to users

### Optimization Strategy

1. **Aggressive caching**: Cache search results for 30 min → reduces API calls by 60-70%
2. **Batch video details**: Use single `videos.list` call with comma-separated IDs (up to 50)
3. **Pagination limits**: Default maxResults=25 (reduces page fetches)
4. **Quota monitoring**: Daily email alert at 80% usage
5. **Upgrade path**: Apply for YouTube API quota extension at 5,000 monthly active users

---

## Appendix B: Security Checklist

- [ ] YouTube API key stored server-side only (env variable)
- [ ] No API keys in client bundle (webpack/vite analyze to verify)
- [ ] Rate limiting on `/api/v1/generate` — 10 req/min per IP
- [ ] CORS whitelist — only production domain
- [ ] CSP headers — restrict script-src to trusted origins
- [ ] Helmet middleware for security headers
- [ ] Input validation on all endpoints (server-side, not just client)
- [ ] UUID v4 for all resource IDs (no sequential IDs)
- [ ] JWT stored in httpOnly, Secure, SameSite=Strict cookies
- [ ] OAuth state parameter with CSRF token
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (React's built-in escaping + Content-Security-Policy)

---

## Appendix C: Performance Budget

| Metric | Target | Measurement Tool |
|--------|--------|-----------------|
| Initial JS bundle | <150KB | Vite bundle analysis |
| LCP | <2.5s | Lighthouse |
| TTI | <3.5s | Lighthouse |
| CLS | <0.1 | Lighthouse |
| FID | <100ms | Web Vitals |
| API response time (p95) | <2s | Server logs / Sentry |
| Time to playlist (user) | <30s total | Analytics timing |
| Lighthouse Performance | >90 | Lighthouse CI |
| Lighthouse Accessibility | >95 | Lighthouse CI |
| Lighthouse Best Practices | >95 | Lighthouse CI |
| Lighthouse SEO | >90 | Lighthouse CI |
