# 📋 Detailed PRD: YouTube Smart Playlist Creator

**Version**: v2.0 (Expanded from v1.0 PRD)  
**Date**: May 29, 2026  
**Owner**: TBD  
**Status**: DRAFT — Pending Engineering Manager Review

---

## 1. Overview

### 1.1 Product Name
**YouTube Smart Playlist Creator** — A web application that generates custom YouTube playlists from any query and plays them in an embedded auto-advancing player.

### 1.2 Problem Statement
Manually creating YouTube playlists for specific moods, artists, or use-cases is time-consuming. Users must search each video individually, add it to a playlist, and manage playback manually. YouTube's own playlist tools lack advanced conditional filtering (duration range, video type exclusion, tag matching, view count thresholds). No existing tool combines all of these filters with an auto-advancing embedded player in a single interface.

### 1.3 Target Audience
| Persona | Description | Key Need |
|---------|-------------|----------|
| **Music Fan** | Listens to specific artists/genres for hours | Generate full playlists from one query |
| **Study/Work User** | Wants lectures, lofi, ambient without distractions | Filter out music videos, control duration |
| **Gym/Fitness User** | Needs high-energy music for workouts | Exclude "live" and "reaction" tags, set duration |
| **Curator** | Creates themed playlists to share with friends | Advanced filtering + shareable links |
| **Casual Listener** | Wants hands-free auto-play | Just type a query and press play |

### 1.4 Goals
1. Users create a playlist in **<30 seconds** by typing a single query
2. Support **8 advanced filters**: duration, video type, tags (include/exclude), upload date, view count, max results, safe search
3. Play videos **sequentially with auto-advance** in an embedded player
4. **No YouTube login required** for playback; optional OAuth to save/share
5. Meet **WCAG 2.2 AA accessibility standards**
6. Page load **<2 seconds**, initial playlist generation **<3 seconds**

### 1.5 Non-Goals
1. Downloading YouTube videos — streaming only
2. Creating playlists directly on user's YouTube account in v1
3. Mobile apps — web only for v1 (responsive design for mobile browsers)
4. Collaborative/real-time playlists
5. AI-based recommendations beyond keyword/tag matching
6. Cross-platform (Spotify, Apple Music) import/export

---

## 2. User Stories & Acceptance Criteria

### US1: Quick Music Playlist Generation
**As a** music fan  
**I want to** type "Arijit Singh" and get a playlist  
**So that** I can listen without searching each song

**Acceptance Criteria:**
- Given an empty search field, when user types "Arijit Singh" and clicks "Generate", then 25 videos are returned within 3 seconds
- Each result shows: thumbnail, title, channel name, duration
- Results are sorted by relevance (YouTube default)
- If query returns 0 results, empty state is shown: "No videos found for 'Arijit Singh'. Try a different search term."
- If YouTube API quota is exceeded, error state is shown: "We're getting too popular. Try again in a few minutes."

### US2: Filtered Study Playlist
**As a** study user  
**I want to** filter for videos 10-20 minutes, exclude music videos  
**So that** I get only lectures/podcasts

**Acceptance Criteria:**
- Given the filter panel open, when user sets Duration = "Custom 10-20 min", Video Type = exclude "Music", then applied filters are displayed as tags
- When user clicks "Generate", results show only videos 10-20 min long
- No video with "music" in title/tags appears (heuristic exclusion)
- If no videos match the combined filters, empty state: "No videos match your filters. Try removing some conditions."

### US3: Gym Workout Playlist
**As a** gym user  
**I want to** create a 1-hour playlist of "high bpm songs" excluding "live" tag  
**So that** my workout isn't interrupted

**Acceptance Criteria:**
- Given query "high bpm songs" and exclude keywords "live", when user generates, videos with "live" in title/tags are not shown
- Estimated total duration is shown (e.g., "~47 minutes of content")
- User can regenerate to get more/less total duration
- At least 10 videos are returned (or fewer if matching videos are limited)

### US4: Saved Playlist Replay
**As a** returning user  
**I want to** save my playlist and replay it later  
**So that** I don't rebuild it every time

**Acceptance Criteria:**
- Given user is authenticated (OAuth), when user generates a playlist, a "Save" button is visible
- When user clicks "Save", playlist is saved to their account
- On return visit, user can see "My Playlists" page with all saved playlists
- Clicking a saved playlist loads the full queue and starts playback
- User can delete a saved playlist with confirmation dialog

### US5: Hands-Free Auto-Play
**As a** casual user  
**I want to** hit play and let it auto-run all videos  
**So that** I get a hands-free experience

**Acceptance Criteria:**
- Given a generated playlist, when user clicks "Play", first video starts immediately
- When video ends (onStateChange = ENDED), next video auto-plays within 1 second
- When last video in queue ends, player stops (or loops if Repeat is on)
- User can toggle Shuffle — queue reorders randomly, no duplicates
- User can toggle Repeat — queue loops when last video ends
- User can drag-and-drop reorder videos in the "Up Next" queue

---

## 3. Functional Requirements

### 3.1 Core Flow
```
[Homepage] → Enter Query → Configure Filters (optional) → Click Generate
    → Loading State → [Playlist View] → Click Play → Auto-Advance
    → Save (auth required) → Share (auth optional)
```

1. **Search Input**: Text input at center of homepage. Placeholder: "Type an artist, topic, or keyword..."
2. **Filter Panel**: Toggle-able panel with all filter controls
3. **Generate Button**: Primary CTA "Generate Playlist" — triggers API call
4. **Loading State**: Skeleton UI with pulsing thumbnail placeholders
5. **Results Display**: Scrollable list with thumbnail, title, channel, duration, view count
6. **Player Initiation**: Click any video or "Play All" to start
7. **Auto-Advance**: YouTube IFrame Player API `onStateChange` event triggers next video
8. **Save**: Auth-gated button to persist playlist
9. **Share**: Copy link button (clipboard API) for shareable URL

### 3.2 Filtering Conditions (Detailed)

| Filter | Type | UI Control | Options | API Implementation | Priority |
|--------|------|------------|---------|-------------------|----------|
| **Duration** | Range | Slider + presets | <4min, 4-20min, >20min, Custom (min/max inputs) | Parse ISO 8601 from `contentDetails.duration`; filter server-side | P0 (M1) |
| **Video Type** | Multi-select | Checkbox group | Music 🎵, Live 📡, Shorts 📱, Standard 📺 | Heuristic: check `liveBroadcastContent`, title/tags for "music", "#shorts", "live" | P0 (M1) |
| **Keywords Include** | Text | Text input (comma-separated) | User-defined | Match against `snippet.tags`, title, description. Case-insensitive | P0 (M1) |
| **Keywords Exclude** | Text | Text input (comma-separated) | User-defined | Exclude videos where any keyword appears in title, tags, or description | P0 (M1) |
| **Upload Date** | Select | Dropdown | Last week, month, year, Custom range (date picker) | Filter by `snippet.publishedAt` | P1 (M2) |
| **Min View Count** | Number | Input with "k" suffix | User-defined (e.g., "100k") | Check `statistics.viewCount` | P1 (M2) |
| **Max Results** | Number | Slider 10-50 | 10-50 (default 25) | `maxResults` param in search.list | P0 (M1) |
| **Safe Search** | Toggle | Switch | On/Off (default: On) | `safeSearch` param: moderate/strict | P0 (M1) |

### 3.3 Player Features (Detailed)

| Feature | Behavior | Implementation |
|---------|----------|---------------|
| **Auto-Advance** | Next video plays when current ends | `onStateChange` → `player.cueVideoById(nextVideoId)` |
| **Shuffle** | Randomizes queue order, no duplicates | Fisher-Yates shuffle; track played indices |
| **Repeat** | Loops entire queue when last video ends | Check repeat flag before stopping at queue end |
| **Skip** | Play next video in queue | `player.loadVideoById(nextVideoId)` |
| **Previous** | Play previous video in queue | Maintain history stack; `player.loadVideoById(prevVideoId)` |
| **Seek Bar** | YouTube's native seek bar (re-styled) | `player.seekTo(seconds)` |
| **Progress Bar** | Shows current/total per video + overall queue progress | Custom progress bar using `player.getCurrentTime()` / `player.getDuration()` |
| **Up Next Queue** | Reorderable list of upcoming videos | Drag-and-drop via HTML5 DnD or library (react-beautiful-dnd) |
| **Volume Control** | Mute/unmute + slider | `player.mute()` / `player.unMute()` / `player.setVolume()` |
| **Picture-in-Picture** | Optional PiP mode | YouTube IFrame Player API supports PiP |

### 3.4 Account & Persistence

#### Guest Mode
- Playlist stored in **localStorage**
- Key: `yspc_playlist_{timestamp}`
- Max: 10 recent playlists (oldest evicted on overflow)
- Data: `{ query, filters, videos: [{ id, title, thumbnail, duration, channel }], createdAt }`
- Lost on: browser cache clear, localStorage clear, incognito close

#### Auth Mode (Google OAuth)
- **OAuth Provider**: Google OAuth 2.0 with PKCE flow
- **Scopes**: `profile`, `email` (minimal)
- **Token Storage**: HTTP-only cookies (backend-managed JWT)
- **JWT**: 15-minute access token + 7-day refresh token rotation
- **Features**: Save unlimited playlists, share links, access from any device

#### Share Links
- Format: `site.com/p/{uuid}`
- UUID v4 (prevents enumeration)
- Public read access (no auth required to view)
- Shareable on social media with Open Graph tags

---

## 4. Technical Requirements

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                        │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ React    │  │ Zustand      │  │ YouTube IFrame    │  │
│  │ SPA      │  │ (state mgmt) │  │ Player API        │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬──────────┘  │
│       │               │                    │              │
│       └───────────────┼────────────────────┘              │
│                       │ HTTP/HTTPS                        │
└───────────────────────┼──────────────────────────────────┘
                        │
              ┌─────────┴──────────┐
              │  Cloudflare DNS     │
              │  + CDN              │
              └─────────┬──────────┘
                        │
┌───────────────────────┼──────────────────────────────────┐
│             Node.js/Express API Server                     │
│  ┌────────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │ Auth       │  │ YouTube  │  │ Playlist CRUD      │   │
│  │ Middleware │  │ API Proxy│  │ Controller         │   │
│  └─────┬──────┘  └────┬─────┘  └─────────┬──────────┘   │
│        │              │                   │               │
│        └──────────────┼───────────────────┘               │
│                       │                                   │
└───────────────────────┼──────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
  ┌──────────────┐          ┌──────────────────┐
  │  PostgreSQL   │          │  YouTube Data    │
  │  Database     │          │  API v3          │
  │  (Railway)    │          │  (External)      │
  └──────────────┘          └──────────────────┘
```

### 4.2 Tech Stack

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Frontend Framework** | React | 18+ | De facto standard; YouTube IFrame Player API has React wrappers |
| **Type System** | TypeScript | 5.x | Type safety for API responses, reducers, component props |
| **Build Tool** | Vite | 5.x | Fast HMR, tree-shaking, code splitting |
| **State Management** | Zustand | 4.x | Lightweight; simpler than Redux for this scale |
| **Routing** | React Router | 6.x | Client-side routing, lazy loading |
| **UI Framework** | Tailwind CSS | 3.x | Utility-first, rapid prototyping, consistent design |
| **Backend** | Node.js + Express | 20 LTS | Familiar, same language as frontend, fast for API proxy |
| **Database** | PostgreSQL | 15+ | Relational, ACID compliant, great for structured playlist data |
| **ORM** | Prisma | 5.x | Type-safe queries, auto-generated types, migrations |
| **Authentication** | Passport.js (Google OAuth) | latest | Well-maintained, Google OAuth strategy available |
| **JWT** | jsonwebtoken + bcrypt | latest | Standard token-based auth |
| **Hosting** | Vercel (frontend) + Railway (backend + DB) | — | Vercel for static SPA, Railway for Node.js + PostgreSQL |
| **Error Tracking** | Sentry | latest | Free tier covers MVP |
| **CI/CD** | GitHub Actions | — | Free for public repos |

### 4.3 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  avatar_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlists table
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  query VARCHAR(500) NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_playlists_user_id ON playlists(user_id);

-- Videos within a playlist
CREATE TABLE playlist_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  youtube_id VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  channel VARCHAR(255) NOT NULL,
  thumbnail VARCHAR(500),
  duration_seconds INTEGER,
  view_count BIGINT,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_playlist_videos_playlist_id ON playlist_videos(playlist_id);
CREATE INDEX idx_playlist_videos_position ON playlist_videos(playlist_id, position);
```

### 4.4 API Endpoints (Detailed)

#### POST /api/v1/generate
Generate a playlist from query + filters.

**Request Body:**
```json
{
  "query": "Arijit Singh",
  "filters": {
    "durationMin": 120,
    "durationMax": 1200,
    "excludeTypes": ["music", "live"],
    "includeKeywords": ["official"],
    "excludeKeywords": ["reaction", "cover"],
    "uploadDate": "last_month",
    "minViews": 100000,
    "maxResults": 25,
    "safeSearch": true
  }
}
```

**Response (200):**
```json
{
  "videos": [
    {
      "id": "abc123",
      "title": "Arijit Singh - Best Hits (Official)",
      "channel": "T-Series",
      "thumbnail": "https://i.ytimg.com/vi/abc123/mqdefault.jpg",
      "duration": 312,
      "viewCount": 45200000
    }
  ],
  "totalDuration": 7800,
  "totalResults": 25,
  "cached": false
}
```

**Error Responses:**
- `400` — Invalid query or filter parameters
- `429` — Rate limit exceeded (too many requests)
- `502` — YouTube API returned error (with generic user message)
- `503` — YouTube API quota exhausted

#### POST /api/v1/auth/google
Initiate or complete Google OAuth flow.

**Request (callback):**
```json
{
  "code": "oauth_authorization_code",
  "state": "csrf_state_hash"
}
```

**Response (200):**
```json
{
  "token": "jwt_access_token",
  "user": { "id": "uuid", "email": "user@email.com", "name": "User Name" }
}
```

#### POST /api/v1/playlists
Save a playlist (requires auth).

**Request Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
  "name": "My Arijit Singh Playlist",
  "query": "Arijit Singh",
  "filters": { "maxResults": 25 },
  "videos": [
    { "youtubeId": "abc123", "title": "...", "channel": "...", "thumbnail": "...", "duration": 312, "position": 0 }
  ]
}
```

**Response (201):** `{ "id": "playlist-uuid", "shareUrl": "site.com/p/playlist-uuid" }`

#### GET /api/v1/playlists/:id
Get a saved playlist (public read access).

**Response (200):** Full playlist object with videos array.

#### GET /api/v1/playlists/user
List user's playlists (requires auth).

**Response (200):** `{ "playlists": [{ id, name, query, videoCount, createdAt }] }`

#### DELETE /api/v1/playlists/:id
Delete a playlist (requires auth, must own playlist).

**Response (204):** No content.

### 4.5 Security Requirements

| Requirement | Implementation |
|-------------|---------------|
| **YouTube API Key** | Server-side only (env variable). Never in client bundle |
| **Input Sanitization** | Strip HTML tags from search queries, playlist names. Validate all inputs server-side |
| **Rate Limiting** | 10 requests/min per IP on `/api/v1/generate`. 5 requests/min on login |
| **CORS** | Whitelist specific origins (production domain only) |
| **CSP Headers** | `default-src 'none'; script-src 'self' https://www.youtube.com; frame-src https://www.youtube.com` |
| **HTTPS** | Enforced. TLS 1.2+ with HSTS header |
| **Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: deny`, `Content-Security-Policy: ...` |
| **JWT Storage** | HTTP-only, Secure, SameSite=Strict cookies |
| **UUIDs** | All resource IDs are UUID v4 (no sequential IDs) |
| **localStorage** | No tokens, no PII. Only playlist references and display names |

### 4.6 Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial page load (LCP) | <2.5s | Lighthouse |
| Time to Interactive | <3.5s | Lighthouse |
| Playlist generation time | <3s | Server timing |
| Bundle size (initial JS) | <150KB | Webpack/Vite bundle analysis |
| API quota per generation | <150 units | API monitoring |
| Cumulative Layout Shift | <0.1 | Lighthouse |
| First Input Delay | <100ms | Web Vitals |

### 4.7 Accessibility Requirements (WCAG 2.2 AA)

| Requirement | WCAG Criterion | Implementation |
|-------------|---------------|---------------|
| **Keyboard navigation** | 2.1.1 | All player controls, filter inputs, queue items reachable via Tab |
| **Focus indicators** | 2.4.7 | Visible focus ring on all interactive elements (3:1 contrast) |
| **ARIA labels** | 4.1.2 | All icon buttons (play, skip, shuffle, repeat) have aria-label |
| **Live regions** | 4.1.3 | aria-live="polite" on queue updates, aria-live="assertive" on errors |
| **Color contrast** | 1.4.3 | Text: 4.5:1 minimum. Large text: 3:1 minimum |
| **Alt text** | 1.1.1 | Thumbnails: "Thumbnail for {title} by {channel}" |
| **Error announcements** | 4.1.3 | role="alert" on toast messages, error states |
| **Skip to content** | 2.4.1 | Skip link at top of page |
| **Reduced motion** | 2.3.3 | Respect prefers-reduced-motion; disable animations |
| **Drag-and-drop alternative** | 2.5.1 | Queue reorder also via move up/down buttons |

---

## 5. UI/UX Requirements

### 5.1 Screen Descriptions

#### Screen 1: Homepage
```
┌─────────────────────────────────────────────────────────┐
│  🎵 YouTube Smart Playlist Creator                       │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Search artists, topics, or keywords...          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  [Filters ▼]                            [Generate 🚀]   │
│                                                          │
│  Filter Panel (expanded state):                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Duration: [<4min] [4-20min] [>20min] [Custom]   │   │
│  │ Video Type: ☑ Music ☐ Live ☐ Shorts ☑ Standard  │   │
│  │ Include Keywords: [official, lyric]              │   │
│  │ Exclude Keywords: [live, reaction]               │   │
│  │ Upload Date: [Last month ▼]                      │   │
│  │ Min Views: [100k]    Max Results: [25 ═══●═══]  │   │
│  │ Safe Search: [On 🟢]                             │   │
│  │ [Apply Filters] [Reset All]                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Examples: "Try: lofi beats, Arijit Singh, gym music"   │
└─────────────────────────────────────────────────────────┘
```

#### Screen 2: Playlist View
```
┌─────────────────────────────────────────────────────────┐
│ ← Back                          My Playlist Name [Edit] │
│                       [Save] [Share] [Regenerate]        │
│ ┌────────────────────┐ ┌──────────────────────────────┐ │
│ │  ▶️ Video Player    │ │  Up Next (8 videos · 47 min) │ │
│ │                     │ │                              │ │
│ │                    │ │ ☰ Track 1 - Now Playing ▶️  │ │
│ │   YT IFrame Player  │ │          Channel · 5:12      │ │
│ │                     │ │                              │ │
│ │                    │ │ ⠿ Track 2                     │ │
│ │                     │ │          Channel · 4:30      │ │
│ │                     │ │                              │ │
│ │ ◀⏮ ⏸⏭ ▶️ 🔀🔁      │ │ ⠿ Track 3                     │ │
│ │ ████████████░░░░ 3:12│ │          Channel · 6:45      │ │
│ │  / 4:30              │ │                              │ │
│ └────────────────────┘ │ ⠿ Track 4                     │ │
│                        │          Channel · 3:20      │ │
│                        └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### Screen 3: My Playlists (Auth Required)
```
┌─────────────────────────────────────────────────────────┐
│  My Playlists                    [User Name ▼]           │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐                             │
│  │      │ │      │ │      │                             │
│  │ 🎵 A │ │ 📚   │ │ 💪   │                             │
│  │ Arij │ │ Study│ │ Gym  │                             │
│  │ ith  │ │ Lofi │ │ Hits │                             │
│  │ Singh│ │      │ │      │                             │
│  │25 vid│ │12 vid│ │30 vid│                             │
│  │      │ │      │ │      │                             │
│  └──────┘ └──────┘ └──────┘                             │
│                                                          │
│  [+ New Playlist]  [Import from Guest Mode]              │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Empty & Error States

| State | Trigger | UI | Copy |
|-------|---------|----|------|
| **No results** | Query returns 0 videos | Illustration of empty playlist + message + suggestion chips | "No videos match your search. Try: adjusting your filters, using different keywords, or checking your spelling" |
| **API quota exceeded** | YouTube daily quota exhausted | Warning illustration + message + retry timer | "We're getting too popular! 🙌 YouTube API limit reached. Try again in [X] minutes, or come back tomorrow." |
| **Video unavailable** | Individual video deleted/private | Auto-skip + toast notification | Toast: "Skipped '{title}' — video unavailable" (3s auto-dismiss) |
| **Network error** | Client offline or server down | Offline illustration + retry button | "Can't reach our servers. Check your internet connection and try again." |
| **Auth required** | Unauthenticated user tries to save | Modal with Google Sign-In | "Save your playlist to access it from anywhere. Sign in with Google (free!)" |
| **Guest mode notice** | Guest user's first playlist | Subtle banner below search bar | "🎧 Playing in guest mode. Sign in to save your playlists forever." |
| **localStorage full** | Guest exceeds localStorage quota | Toast notification | "Guest playlist storage is full. Sign in to save unlimited playlists!" |

### 5.3 Responsive Breakpoints

| Breakpoint | Layout | Behavior |
|------------|--------|----------|
| **≥1024px (Desktop)** | Player + Queue side-by-side | Full layout with sidebar |
| **768-1023px (Tablet)** | Player on top, Queue below | Stacked layout, full-width player |
| **<768px (Mobile)** | Player full-width, Queue as bottom sheet | Slide-up queue, compact controls |

---

## 6. DevOps & Infrastructure

### 6.1 Hosting Strategy
- **Frontend**: Vercel (static SPA, automatic CDN, free tier)
- **Backend API**: Railway (Node.js hosting with PostgreSQL add-on, ~$5-10/month)
- **Domain**: Custom domain with Cloudflare DNS + DDoS protection
- **CDN**: Cloudflare (caching static assets, SSL termination)

### 6.2 CI/CD Pipeline (GitHub Actions)
```
Push to main → Lint (ESLint + Prettier) → Typecheck (tsc --noEmit)
→ Test (vitest) → Build (vite build) → Deploy to Vercel (frontend)
→ Deploy to Railway (backend)
```

### 6.3 Environments
| Environment | URL | Database | Features |
|-------------|-----|----------|----------|
| **Development** | localhost:5173 | Local SQLite | Hot reload, debug logging |
| **Staging** | staging.yourapp.com | Railway staging DB | Full features, test data |
| **Production** | yourapp.com | Railway production DB | Production data, monitoring |

### 6.4 Monitoring & Alerting
- **Error Tracking**: Sentry (free tier) — frontend + backend
- **Performance**: Lighthouse CI in CI/CD pipeline
- **API Quota**: Daily email alert at 80% usage
- **Uptime**: Free monitoring (Better Uptime or Uptime Robot)
- **Analytics**: PostHog (self-hosted, privacy-compliant) or Plausible

---

## 7. Success Metrics

| Metric | Target | Instrumentation |
|--------|--------|-----------------|
| Time to first playlist | <30s | Timer from Generate click → results rendered |
| Playlist completion rate | >60% play >3 songs | Track video start events per playlist session |
| Average playlist duration | >20 min session | Sum of video play durations per session |
| API quota per generation | <150 units avg | Log API unit costs per generate request |
| Guest → Signup conversion | >20% | Funnel: generate → play → save → signup |
| Share click rate | >5% of playlist views | Clipboard API share click tracking |
| Bounce rate (homepage) | <40% | PostHog/Plausible session tracking |
| Page load time | <2.5s LCP | Lighthouse / Web Vitals |
| Mobile usage share | >30% | User agent parsing |

---

## 8. Milestones & Delivery Plan

| Phase | Scope | Deliverables | Dependencies | ETA |
|-------|-------|-------------|--------------|-----|
| **M0: Foundation** | Project setup, CI/CD, DB schema, API scaffolding | GitHub repo, Vercel + Railway setup, Prisma schema, Express server | None | Week 1 |
| **M1: Core Gen** | Search API, duration filter, keyword exclude, player | `/api/v1/generate` endpoint, basic Homepage UI, YouTube IFrame Player, auto-advance, skip/play/pause | M0 | Week 2-3 |
| **M2: Filters** | All remaining filters, queue reorder, improved UI | Full filter panel, queue drag-drop, reshuffle/repeat, progress bar | M1 | Week 3-4 |
| **M3: Accounts** | Google OAuth, save/load playlists, share links | Auth flow, My Playlists page, share links with OG tags, localStorage guest mode | M0 (DB needed) | Week 4-5 |
| **M4: Polish** | Error states, responsive, caching, performance, accessibility | Empty/error states, mobile responsive, cache layer, WCAG compliance audit, Sentry integration | M1-M3 | Week 5-6 |

**Total**: 6 weeks (with 1 week buffer)

---

## 9. Open Questions (Resolved)

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Allow manual add/remove after generation? | **Yes, v1.5** | Add/remove individual videos post-generation. Low effort, high value |
| 2 | Copyright-safe mode (CC videos only)? | **No, v1** | Too restrictive; YouTube CC license detection is unreliable |
| 3 | Push playlists to user's YouTube account? | **v2 consideration** | Requires additional YouTube OAuth scopes, significant dev effort |
| 4 | Monetization strategy? | **Freemium in v2** | Free v1 to build traction; premium for advanced filters + unlimited playlists |
| 5 | Mobile app? | **No, v1** | Web-only; responsive design covers mobile browsers |
| 6 | Download support? | **No, v1** | Legal/TOS issues; streaming only |

## 10. Out of Scope (v1)
1. Mobile native apps (iOS/Android)
2. Collaborative / shared playlist editing
3. AI-based recommendations (beyond tag/filter matching)
4. Push to YouTube account
5. Cross-platform import/export (Spotify, Apple Music)
6. User-generated content moderation
7. Admin panel
