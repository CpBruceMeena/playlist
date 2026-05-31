# PRD: YouTube Smart Playlist Creator

## 1. Overview

**Product Name**: YouTube Smart Playlist Creator  
**Version**: v1.0  
**Date**: May 29, 2026  
**Owner**: TBD  

### 1.1 Purpose
Build a web app that lets users generate custom YouTube playlists by entering an artist name, keyword, or topic. The system will pull matching videos from YouTube Data API v3, apply user-defined filters, and play them in auto-mode on the website without redirecting to YouTube.

### 1.2 Problem Statement
Manually creating YouTube playlists for specific moods, artists, or use-cases is time-consuming. Users can’t easily filter by video length, type, or tags, and YouTube’s own playlist tools lack advanced conditional filtering.

### 1.3 Goals
1. Let users create a playlist in <30 seconds by typing a query
2. Support advanced filters: duration, video type, tags, view count, upload date
3. Play videos sequentially in an embedded player with auto-advance
4. No YouTube login required for playback; optional login to save playlists

### 1.4 Non-Goals
1. Downloading YouTube videos - streaming only
2. Creating playlists directly on user’s YouTube account in v1
3. Mobile app - web only for v1

## 2. User Stories

| ID | As a... | I want to... | So that... |
| --- | --- | --- | --- |
| US1 | Music fan | Type "Arijit Singh" and get a playlist | I can listen without searching each song |
| US2 | Study user | Filter for videos 10-20 min, no music videos | I get only lectures/podcasts |
| US3 | Gym user | Create 1hr playlist of “high bpm songs” exclude “live” tag | My workout isn’t interrupted |
| US4 | Returning user | Save my playlist and replay it later | I don’t rebuild it every time |
| US5 | Casual user | Hit play and let it auto-run all videos | I get hands-free experience |

## 3. Functional Requirements

### 3.1 Core Flow
1. **Input**: User enters query in search bar. Query types: `artist name`, `keyword`, `channel name`
2. **Filter Panel**: User sets optional conditions before generating
3. **Fetch**: Backend calls YouTube Data API v3 `search.list` + `videos.list` endpoints
4. **Display**: Show generated playlist with title, thumbnail, duration, channel
5. **Play**: Embedded YouTube IFrame Player starts first video, auto-advances on end
6. **Save**: Logged-in users can save playlist to account. Guest users use localStorage

### 3.2 Filtering Conditions
| Filter | Type | Options | API Field |
| --- | --- | --- | --- |
| **Duration** | Range | <4min, 4-20min, >20min, custom min-max | `contentDetails.duration` |
| **Video Type** | Multi-select | Music, Live, Shorts, Standard | Heuristic: title/tags + `liveBroadcastContent` |
| **Tags/Keywords Must Include** | Text | "official", "lyric", "lofi" | `snippet.tags` + title/desc match |
| **Tags/Keywords Must Exclude** | Text | "live", "reaction", "cover" | `snippet.tags` + title/desc match |
| **Upload Date** | Select | Last week, month, year, custom range | `snippet.publishedAt` |
| **Min View Count** | Number | e.g. >100k | `statistics.viewCount` |
| **Max Results** | Number | 10-50 default 25 | `maxResults` param |
| **Safe Search** | Toggle | On/Off | `safeSearch` param |

### 3.3 Player Features
1. Auto-play next video on `onStateChange = ENDED`
2. Shuffle / Repeat buttons
3. Skip, previous, seek bar
4. Show "Up next" queue, allow drag-drop reorder
5. Current video info + progress bar

### 3.4 Account & Persistence
1. **Guest Mode**: Playlist stored in localStorage, lost on clear
2. **Auth Mode**: Email/Google OAuth. Save unlimited playlists to DB
3. **Share**: Generate shareable link `site.com/p/{playlist_id}`

## 4. Technical Requirements

### 4.1 Architecture


### 4.4 API Endpoints
| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/generate` | Body: {query, filters} → Returns video list |
| POST | `/api/playlists` | Save playlist, requires auth |
| GET | `/api/playlists/:id` | Get playlist for playback |
| GET | `/api/playlists/user` | List user’s playlists |

## 5. UI/UX Requirements

### 5.1 Key Screens
1. **Home**: Search bar + "Filters" dropdown + "Generate" CTA
2. **Playlist View**: Left: player. Right: queue list. Top: playlist name, Save, Share
3. **My Playlists**: Grid of saved playlists for logged-in users

### 5.2 Empty/Error States
1. No results: "No videos match your filters. Try removing some conditions."
2. API quota exceeded: "We’re getting too popular. Try again in a few minutes."
3. Video deleted/unavailable: Auto-skip + toast "Skipped unavailable video"

## 6. Success Metrics

| Metric | Target for MVP |
| --- | --- |
| Time to first playlist | <30s |
| Playlist completion rate | >60% users play >3 songs |
| API quota efficiency | <150 units per generation avg |
| Save rate | >20% of guests convert to signup after 1st playlist |

## 7. Milestones v1.0

| Phase | Scope | ETA |
| --- | --- | --- |
| **M1: Core Gen** | Search + duration + exclude keywords + player | Week 2 |
| **M2: Filters** | All remaining filters + queue reorder | Week 3 |
| **M3: Accounts** | Auth + save + share link | Week 4 |
| **M4: Polish** | Cache, error states, mobile responsive | Week 5 |

## 8. Open Questions
1. Do we allow users to manually add/remove videos after generation?
2. Do we need copyright-safe mode that filters only Creative Commons videos?
3. v2: Push playlist to user’s actual YouTube account via OAuth?

## 9. Out of Scope for v1
1. Mobile apps
2. Collaborative playlists
3. AI-based recommendations beyond keyword search