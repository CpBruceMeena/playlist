# 🎵 YouTube Smart Playlist Creator

**Turn any idea into a playlist.** Type what you want to hear — an artist, a mood, a topic — and get a perfectly curated YouTube playlist with advanced filters and a seamless embedded player.

## Vision

YouTube's native playlist tools are limited. You can't easily generate a playlist from a natural language prompt, apply advanced filters (duration, video type, keyword exclusions), or auto-advance through unrelated videos in a curated queue. YouTube Smart Playlist Creator fills this gap — making content discovery and consumption effortless.

## Features

| Feature | Description |
|---------|-------------|
| **Smart Search** | Describe what you want in natural language — "upbeat indie rock from 2023", "lofi hip hop study beats", "beginner guitar tutorials" |
| **Advanced Filters** | Duration range, video type (music vs. lecture vs. vlog), keyword inclusion/exclusion, minimum views, safe search |
| **Embedded Player** | Full YouTube IFrame Player with play/pause, next/prev, shuffle, repeat, volume control, and auto-advance |
| **Queue Management** | Reorder, remove, and shuffle videos in your generated playlist |
| **Playlist Management** | Save, share, and browse your created playlists (coming in M3) |

## Roadmap

| Milestone | Status | Scope |
|-----------|--------|-------|
| M0 — Foundation | ✅ Done | Monorepo, types, server skeleton, DB schema, page shells |
| M1 — Core Generation | ✅ Done | YouTube search + filters + embedded player + rate limiting |
| M2 — Filters & Queue | 📋 Planned | Enhanced filter UI, drag-drop queue, more filter options |
| M3 — User Accounts | 📋 Planned | OAuth (Google Sign-In), save/load/share playlists |
| M4 — Polish & Launch | 📋 Planned | Caching, responsive, accessibility, CI/CD, public launch |

## Tech Stack

- **Frontend:** React 19 · TypeScript 6 · Vite 8 · Tailwind 4 · Zustand 5
- **Backend:** Go 1.26 · Gin · GORM · PostgreSQL
- **APIs:** YouTube Data API v3

> See [frontend/README.md](./frontend/README.md) and [backend/README.md](./backend/README.md) for technical setup and implementation details.
