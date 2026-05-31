# Smart Playlist Creator 🎵

> AI-powered YouTube playlist generator with smart filters and an embedded player.

Generate custom YouTube playlists by typing a description — like "lofi beats to study to" or "90s rock classics" — and our smart search engine builds a curated playlist with intelligent filtering. Play everything seamlessly in-browser without leaving the website.

## ✨ Features

- **🧠 AI-Powered Generation** — Describe what you want, get a playlist in seconds
- **🎛️ Smart Filters** — Filter by duration, video type, upload date, keywords, views, and more
- **▶️ Embedded Player** — Watch videos directly in-browser with play/pause, next/previous, shuffle, and repeat
- **💾 Save & Organize** — Save playlists locally with inline rename and undo delete
- **🎨 Beautiful Dark UI** — Modern gradient-accented design with smooth animations
- **⌨️ Keyboard Shortcuts** — Space (play/pause), N/P (next/previous), M (mute), ←/→ (seek)

## 🖼️ Screenshots

```
Home Page: Hero section with search input, suggestion chips, and collapsible filter panel
Playlist Page: YouTube player with custom controls, progress bar, and draggable queue
My Playlists: Saved playlist cards with inline rename, load, and undo delete
```

## 🏗️ Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   React Frontend    │ ──→ │  Go Backend API  │ ──→ │  YouTube Data v3 │
│  (Vite + TypeScript)│     │  (Chi Router)    │     │  (External API)  │
│                     │     │                  │     │                  │
│  • Tailwind CSS v4  │     │  • /api/generate │     │  • search.list   │
│  • Zustand Store    │     │  • /api/health   │     │  • videos.list   │
│  • React Router v7  │     │  • Middleware:    │     │                  │
│  • YouTube IFrame   │     │    CORS, Rate     │     │                  │
│    Player API       │     │    Limiter        │     │                  │
└─────────────────────┘     └──────────────────┘     └──────────────────┘
```

### Frontend Component Tree

```
App
├── BrowserRouter
│   ├── HomePage (/) — Search input, filters, suggestions
│   ├── PlaylistPage (/playlist) — Player + queue + save dialog
│   ├── MyPlaylistsPage (/my-playlists) — Saved playlists management
│   └── SharedPlaylistPage (/p/:shareId) — Shared playlist view
└── ToastContainer — Global notification system
```

## 🚀 Getting Started

### Prerequisites

- **Go** 1.22+
- **Node.js** 20+
- **YouTube Data API v3 key**

### 1. Clone & Install

```bash
git clone <repo-url>
cd playlist

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && go mod download && cd ..
```

### 2. Configure Environment

```bash
# Backend — copy and add your YouTube API key
cp backend/.env.example backend/.env
# Edit: YOUTUBE_API_KEY=your_key_here

# Frontend (optional)
cp frontend/.env.example frontend/.env
```

### 3. Run

```bash
# Start both services
bash run.sh
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api

### Available Scripts

| Command | Description |
|---------|-------------|
| `run.sh` | Start both frontend and backend |
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run typecheck` | TypeScript typecheck |
| `npm run build` | Production build |
| `cd backend && go run main.go` | Start Go backend |
| `cd backend && go build -o server .` | Build Go binary |

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `N` | Next video |
| `P` | Previous video |
| `M` | Mute / Unmute |
| `←` | Seek backward (5-10s) |
| `→` | Seek forward (5-10s) |
| `Escape` | Close dialogs |

## 🧩 Tech Stack

### Frontend
- **React** 19 + TypeScript 6
- **Vite** 8 — Build tool
- **Tailwind CSS** v4 — Utility-first styling
- **Zustand** 5 — State management
- **React Router** v7 — Client-side routing
- **YouTube IFrame Player API** — Video playback

### Backend
- **Go** 1.22+ — Server runtime
- **Chi Router** — HTTP routing
- **YouTube Data API v3** — Video search & metadata

## 📁 Project Structure

```
/
├── frontend/              # React + Vite SPA
│   ├── src/
│   │   ├── api/           # API client & hooks
│   │   ├── components/    # UI components
│   │   │   ├── feedback/  # Toast, ErrorState, EmptyState
│   │   │   ├── layout/    # Header
│   │   │   ├── player/    # YouTube player, controls, queue
│   │   │   ├── search/    # SearchInput, FilterPanel, DurationSlider
│   │   │   └── ui/        # Button, Input, Chip, Toggle, etc.
│   │   ├── hooks/         # Custom hooks (useYouTubePlayer)
│   │   ├── pages/         # Route pages
│   │   └── stores/        # Zustand stores
│   └── public/            # Static assets
├── backend/               # Go API server
│   ├── handlers/          # HTTP handlers
│   ├── middleware/        # CORS, rate limiter
│   ├── routes/            # Route definitions
│   ├── services/          # Business logic, YouTube API
│   └── structs/           # Data models
├── cabinet/               # Project management docs
│   ├── cpo/               # Product & feature specs
│   └── skills/            # Review skill definitions
├── types/                 # Shared TypeScript types
├── run.sh                 # Dev startup script
└── README.md
```

## 🧪 Testing

```bash
# TypeScript typecheck
cd frontend && npm run typecheck

# Go build check
cd backend && go build ./...

# Lint
cd frontend && npm run lint
```

## 📄 License

MIT — See [LICENSE](LICENSE) for details.

---

Built with ❤️ using React, Go, and the YouTube API.
