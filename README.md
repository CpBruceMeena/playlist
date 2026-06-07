# Smart Playlist Creator 🎵

> AI-powered YouTube playlist generator with smart filters, multi-singer support, and an embedded player.

Generate custom YouTube playlists by describing what you want in natural language — like *"lofi beats to study to"* or *"90s rock classics"* — and get a curated playlist with intelligent filtering. Select multiple singers for a combined playlist, save your favorites, merge songs into a single video, and watch everything seamlessly in-browser.

## ✨ Features

- **🧠 AI-Powered Generation** — Describe what you want in natural language, get a curated playlist in seconds
- **🎛️ Smart Filters** — Refine results by duration, video type, upload date, keywords, view count, safe search, and max results
- **🎤 Multi-Singer Playlists** — Select 2–5 singers from a database of 500+ across 16 genres, or add custom singer names
- **❤️ My Songs** — Save individual songs from any playlist, grouped by singer with search/filter
- **💾 Save & Organize** — Save entire playlists or selected songs with custom names; inline rename, load, and manage
- **🔀 Merge Videos** — Select songs and merge them into a single video via yt-dlp + ffmpeg, with optional reordering
- **▶️ Embedded Player** — Watch videos in-browser with play/pause, next/previous, shuffle, repeat all, seek, and queue management
- **🔗 Share Playlists** — Generate shareable links to send your playlists to anyone
- **⌨️ Keyboard Shortcuts** — Arrow keys, Escape, and more for easy navigation
- **🎨 Dark Gradient UI** — Modern design with blue-to-purple gradients, smooth animations, and glassmorphism effects

## 🏗️ Architecture

| Service | Language | Port | Purpose |
|---------|----------|------|---------|
| **Frontend** | React / Vite / TypeScript | `5173` | User interface — playlist browser, player, and management |
| **Backend** | Go / Gin | `3001` | Primary API — YouTube search, playlist CRUD, singer database, proxies merge requests |
| **Merge Server** | Python / Flask | `5002` | Video merge service — downloads YouTube videos with yt-dlp, concatenates with ffmpeg |

The **Go backend** is the single entry point for all frontend API calls. The **Merge Server** runs as a separate process, called only by the Go backend via proxy.

## 🚀 Quick Start

### Prerequisites
- **Go** 1.26+
- **Node.js** 20+ with npm
- **Python** 3.10+
- **PostgreSQL** (running on port 5432)
- **ffmpeg** — Required for the merge server
- **yt-dlp** — Required for the merge server

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd playlist

# Install frontend dependencies
cd frontend && npm install && cd ..

# Download Go dependencies
cd backend && go mod download && cd ..

# Install Python dependencies for the merge server
pip3 install flask

# Configure your YouTube API key (see backend/README.md)

# Start all 3 services
bash run.sh
```

### Running Services Manually

```bash
# Terminal 1: Backend (Go)
cd backend && go run main.go

# Terminal 2: Merge Server (Python)
python3 scripts/merge_server.py

# Terminal 3: Frontend
cd frontend && npx vite
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api
- **Merge Server:** http://localhost:5002 (proxied through the backend)

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `→` | Previous / Next video |
| `↑` / `↓` | Previous / Next video |
| `Escape` | Close dialogs |

## 📄 License

MIT — See [LICENSE](LICENSE) for details.

---

Built with ❤️ using React, Go, and the YouTube API.
