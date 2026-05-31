# Frontend — YouTube Smart Playlist Creator

React web application built with Vite, TypeScript, Tailwind CSS, and Zustand.

## Tech Stack

- **Framework:** React 19 + TypeScript 6
- **Build:** Vite 8
- **Styling:** Tailwind CSS 4
- **State:** Zustand 5
- **Routing:** React Router 7
- **Player:** YouTube IFrame Player API

## Structure

```
├── src/
│   ├── api/           # API client + generate endpoint
│   ├── components/
│   │   ├── ui/        # Primitives: Button, Input, Slider, Toggle, etc.
│   │   ├── layout/    # Header
│   │   ├── feedback/  # LoadingSkeleton, ErrorState, EmptyState
│   │   ├── search/    # SearchInput, FilterPanel, DurationSlider
│   │   └── player/    # YouTubePlayer, PlayerControls
│   ├── hooks/         # useYouTubePlayer
│   ├── pages/         # HomePage, PlaylistPage, MyPlaylistsPage, SharedPlaylistPage
│   └── stores/        # filterStore, playlistStore, playerStore
└── types/             # Shared TypeScript type definitions (@playlist/types)
```

## Setup

```bash
# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev

# TypeScript typecheck
npm run typecheck

# Production build
npm run build
```

## Environment

No frontend-specific environment variables are required for development. The Vite dev server proxies `/api` requests to `http://localhost:3001` (the Go backend).

## Dev Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run typecheck` | TypeScript type checking |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |
